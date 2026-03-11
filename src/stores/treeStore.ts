import { create } from 'zustand'
import { createModuleLogger } from '../utils/logger'
import type { DriveInfo, FileItem } from '../types'

const log = createModuleLogger('TreeStore')

const debugLog = (message: string, data?: unknown) => {
  log.info(message, data)
  if (window.electronAPI?.debug?.log) {
    window.electronAPI.debug.log(`[TreeStore] ${message}`, data)
  }
}

export interface TreeNode {
  id: string
  name: string
  path: string
  type: 'root' | 'drive' | 'folder'
  isExpanded: boolean
  isLoading: boolean
  children: TreeNode[] | null
  hasChildren: boolean
  icon?: string
  error?: string | null
}

interface TreeState {
  rootNode: TreeNode | null
  selectedPath: string | null
  expandedPaths: Set<string>
  isLoading: boolean
  error: string | null
  panelWidth: number
  isPanelCollapsed: boolean

  initializeTree: () => Promise<void>
  loadNodeChildren: (nodeId: string, nodePath: string) => Promise<void>
  toggleNode: (nodeId: string, nodePath: string) => Promise<void>
  selectNode: (path: string | null) => void
  expandToPath: (path: string) => Promise<void>
  setPanelWidth: (width: number) => void
  togglePanel: () => void
  findNodeByPath: (path: string) => TreeNode | null
}

const getDriveIcon = (type: string): string => {
  switch (type) {
    case 'fixed':
      return '💾'
    case 'removable':
      return '📀'
    case 'network':
      return '🌐'
    case 'cdrom':
      return '💿'
    default:
      return '📁'
  }
}

export const useTreeStore = create<TreeState>((set, get) => ({
  rootNode: null,
  selectedPath: null,
  expandedPaths: new Set<string>(),
  isLoading: false,
  error: null,
  panelWidth: 200,
  isPanelCollapsed: false,

  initializeTree: async () => {
    debugLog('初始化目录树')
    set({ isLoading: true, error: null })

    try {
      const result = await window.electronAPI.fs.getDrives()
      
      if (!result.success || !result.data) {
        throw new Error(result.error || '获取驱动器列表失败')
      }

      const drives: DriveInfo[] = result.data
      debugLog(`获取到 ${drives.length} 个驱动器`, drives.map(d => d.path))

      const rootNode: TreeNode = {
        id: 'root',
        name: '此电脑',
        path: '',
        type: 'root',
        isExpanded: true,
        isLoading: false,
        children: drives.map((drive: DriveInfo) => ({
          id: drive.path,
          name: drive.name,
          path: drive.path,
          type: 'drive' as const,
          isExpanded: false,
          isLoading: false,
          children: null,
          hasChildren: true,
          icon: getDriveIcon(drive.type),
        })),
        hasChildren: true,
        icon: '💻',
      }

      set({ rootNode, isLoading: false })
      debugLog('目录树初始化完成')
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '未知错误'
      debugLog(`初始化失败: ${errMsg}`)
      set({ 
        error: errMsg,
        isLoading: false 
      })
    }
  },

  loadNodeChildren: async (nodeId: string, nodePath: string) => {
    const { rootNode } = get()
    if (!rootNode) return

    debugLog(`加载节点子目录`, { nodeId, nodePath })

    const updateNodeLoading = (node: TreeNode, targetId: string, loading: boolean): TreeNode => {
      if (node.id === targetId) {
        return { ...node, isLoading: loading }
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(child => updateNodeLoading(child, targetId, loading))
        }
      }
      return node
    }

    const updateNodeError = (node: TreeNode, targetId: string, error: string | null): TreeNode => {
      if (node.id === targetId) {
        return { ...node, error, isLoading: false }
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(child => updateNodeError(child, targetId, error))
        }
      }
      return node
    }

    set({ rootNode: updateNodeLoading(rootNode, nodeId, true) })

    try {
      const result = await window.electronAPI.fs.readDirectory(nodePath)
      
      if (!result.success || !result.data) {
        throw new Error(result.error || '读取目录失败')
      }

      const folders: FileItem[] = result.data.files
        .filter((file: FileItem) => file.isDirectory)
        .sort((a: FileItem, b: FileItem) => a.name.localeCompare(b.name))

      const children: TreeNode[] = []
      
      for (const folder of folders) {
        try {
          const hasChildren = await window.electronAPI.fs.hasChildren(folder.path)
          children.push({
            id: folder.path,
            name: folder.name,
            path: folder.path,
            type: 'folder' as const,
            isExpanded: false,
            isLoading: false,
            children: null,
            hasChildren,
            icon: '📁',
          })
        } catch {
          debugLog(`检查目录 "${folder.name}" 是否有子目录失败，假设为空目录`)
          children.push({
            id: folder.path,
            name: folder.name,
            path: folder.path,
            type: 'folder' as const,
            isExpanded: false,
            isLoading: false,
            children: null,
            hasChildren: false,
            icon: '📁',
          })
        }
      }

      const updateNodeChildren = (node: TreeNode, targetId: string, newChildren: TreeNode[]): TreeNode => {
        if (node.id === targetId) {
          return { ...node, children: newChildren, isLoading: false, hasChildren: newChildren.length > 0, error: null }
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(child => updateNodeChildren(child, targetId, newChildren))
          }
        }
        return node
      }

      set(state => ({
        rootNode: updateNodeChildren(get().rootNode!, nodeId, children),
        expandedPaths: new Set([...state.expandedPaths, nodeId])
      }))

      debugLog(`加载完成，共 ${children.length} 个子目录`, { nodeId, expandedPaths: Array.from(get().expandedPaths) })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      const userFriendlyError = errorMessage.includes('EPERM') 
        ? '无法访问该目录：权限不足'
        : errorMessage.includes('ENOENT')
        ? '目录不存在'
        : `加载目录失败：${errorMessage}`
      
      debugLog(`加载子目录失败: ${errorMessage}`)
      set({ rootNode: updateNodeError(get().rootNode!, nodeId, userFriendlyError) })
    }
  },

  toggleNode: async (nodeId: string, nodePath: string) => {
    const { expandedPaths, rootNode } = get()
    
    debugLog(`toggleNode 被调用`, { nodeId, nodePath, currentExpanded: expandedPaths.has(nodeId) })
    
    const findNode = (node: TreeNode, targetId: string): TreeNode | null => {
      if (node.id === targetId) return node
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, targetId)
          if (found) return found
        }
      }
      return null
    }

    const node = rootNode ? findNode(rootNode, nodeId) : null
    if (!node) {
      debugLog(`toggleNode: 未找到节点`, { nodeId })
      return
    }

    if (expandedPaths.has(nodeId)) {
      const newExpanded = new Set(expandedPaths)
      newExpanded.delete(nodeId)
      set({ expandedPaths: newExpanded })
      debugLog(`节点已折叠`, { nodeId, expandedPaths: Array.from(newExpanded) })
    } else {
      if (node.children === null && node.hasChildren) {
        debugLog(`节点需要加载子目录`, { nodeId })
        await get().loadNodeChildren(nodeId, nodePath)
      } else {
        set(state => ({
          expandedPaths: new Set([...state.expandedPaths, nodeId])
        }))
        debugLog(`节点已展开`, { nodeId, expandedPaths: Array.from(get().expandedPaths) })
      }
    }
  },

  selectNode: (path: string | null) => {
    debugLog(`选中节点: ${path || '无'}`)
    set({ selectedPath: path })
  },

  expandToPath: async (targetPath: string) => {
    debugLog('expandToPath 被调用', { targetPath })
    
    const { rootNode, loadNodeChildren } = get()
    
    if (!rootNode) {
      debugLog('rootNode 为空，无法展开')
      return
    }

    // 确保根节点在 expandedPaths 中
    set(state => ({
      expandedPaths: new Set([...state.expandedPaths, 'root'])
    }))
    debugLog('已将根节点加入 expandedPaths')

    const normalizePath = (path: string): string => {
      return path.replace(/\\/g, '/').toLowerCase().replace(/\/$/, '')
    }

    const normalizedTarget = normalizePath(targetPath)
    debugLog('标准化目标路径', { normalizedTarget })

    const expandPath = async (node: TreeNode, remainingParts: string[], currentPath: string) => {
      debugLog('expandPath', { currentPath, remainingParts, nodeId: node.id })
      
      if (remainingParts.length === 0) {
        debugLog('已到达目标路径，设置 selectedPath', { targetPath })
        set(() => ({
          selectedPath: targetPath
        }))
        return
      }

      const nextPart = remainingParts[0]
      const nextPath = currentPath ? `${currentPath}\\${nextPart}` : nextPart

      debugLog('尝试加载节点子目录', { nodeId: node.id, nodePath: node.path, hasChildren: node.hasChildren, childrenNull: node.children === null })
      
      if (node.children === null && node.hasChildren) {
        debugLog('调用 loadNodeChildren', { nodeId: node.id, nodePath: node.path || currentPath })
        await loadNodeChildren(node.id, node.path || currentPath)
        debugLog('loadNodeChildren 完成', { nodeId: node.id })
      }

      const updatedState = get()
      const findUpdatedNode = (n: TreeNode, targetId: string): TreeNode | null => {
        if (n.id === targetId) return n
        if (n.children) {
          for (const child of n.children) {
            const found = findUpdatedNode(child, targetId)
            if (found) return found
          }
        }
        return null
      }

      const updatedNode = findUpdatedNode(updatedState.rootNode!, node.id)
      debugLog('获取更新后的节点', { 
        nodeId: node.id, 
        found: !!updatedNode, 
        childrenCount: updatedNode?.children?.length 
      })
      
      if (updatedNode?.children) {
        debugLog(`节点有 ${updatedNode.children.length} 个子节点`)
        for (const child of updatedNode.children) {
          const childPathNormalized = normalizePath(child.path)
          const nextPathNormalized = normalizePath(nextPath)
          
          debugLog('比较路径', { 
            childPath: childPathNormalized, 
            nextPath: nextPathNormalized, 
            childName: child.name, 
            nextPart,
            match: childPathNormalized === nextPathNormalized || child.name.toLowerCase() === nextPart.toLowerCase()
          })
          
          if (childPathNormalized === nextPathNormalized || child.name.toLowerCase() === nextPart.toLowerCase()) {
            debugLog('找到匹配节点', { childName: child.name, childPath: child.path })
            set(state => ({
              expandedPaths: new Set([...state.expandedPaths, child.id])
            }))
            debugLog('已将节点加入 expandedPaths', { childId: child.id, expandedPaths: Array.from(get().expandedPaths) })
            await expandPath(child, remainingParts.slice(1), nextPath)
            return
          }
        }
        debugLog('未找到匹配的子节点', { nextPart })
      }
    }

    debugLog('驱动器列表', { drives: rootNode.children?.map(d => ({ name: d.name, path: d.path })) })
    for (const drive of rootNode.children || []) {
      const drivePathNormalized = normalizePath(drive.path)
      debugLog('检查驱动器', { drivePath: drive.path, drivePathNormalized })
      
      if (normalizedTarget === drivePathNormalized || normalizedTarget.startsWith(drivePathNormalized + '/')) {
        debugLog('找到匹配驱动器', { driveName: drive.name, drivePath: drive.path })
        set(state => ({
          expandedPaths: new Set([...state.expandedPaths, drive.id])
        }))
        
        const relativePath = targetPath.slice(drive.path.length)
        const parts = relativePath.split(/[/\\]/).filter(Boolean)
        debugLog('相对路径部分', { parts, drivePath: drive.path })
        await expandPath(drive, parts, drive.path)
        break
      }
    }
    
    debugLog('expandToPath 完成', { 
      selectedPath: get().selectedPath, 
      expandedPaths: Array.from(get().expandedPaths) 
    })
  },

  setPanelWidth: (width: number) => {
    const minWidth = 150
    const maxWidth = 400
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, width))
    set({ panelWidth: clampedWidth })
  },

  togglePanel: () => {
    set(state => ({ isPanelCollapsed: !state.isPanelCollapsed }))
  },

  findNodeByPath: (path: string): TreeNode | null => {
    const { rootNode } = get()
    if (!rootNode) return null

    const find = (node: TreeNode, targetPath: string): TreeNode | null => {
      if (node.path === targetPath) return node
      if (node.children) {
        for (const child of node.children) {
          const found = find(child, targetPath)
          if (found) return found
        }
      }
      return null
    }

    return find(rootNode, path)
  },
}))
