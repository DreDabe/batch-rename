import { create } from 'zustand'

import type { DriveInfo, FileItem } from '../types'



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
    set({ isLoading: true, error: null })

    try {
      const result = await window.electronAPI.fs.getDrives()
      
      if (!result.success || !result.data) {
        throw new Error(result.error || '获取驱动器列表失败')
      }

      const drives: DriveInfo[] = result.data

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
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '未知错误'
      set({ 
        error: errMsg,
        isLoading: false 
      })
    }
  },

  loadNodeChildren: async (nodeId: string, nodePath: string) => {
    const { rootNode } = get()
    if (!rootNode) return

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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      const userFriendlyError = errorMessage.includes('EPERM') 
        ? '无法访问该目录：权限不足'
        : errorMessage.includes('ENOENT')
        ? '目录不存在'
        : `加载目录失败：${errorMessage}`
      
      set({ rootNode: updateNodeError(get().rootNode!, nodeId, userFriendlyError) })
    }
  },

  toggleNode: async (nodeId: string, nodePath: string) => {
    const { expandedPaths, rootNode } = get()
    
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
      return
    }

    if (expandedPaths.has(nodeId)) {
      const newExpanded = new Set(expandedPaths)
      newExpanded.delete(nodeId)
      set({ expandedPaths: newExpanded })
    } else {
      if (node.children === null && node.hasChildren) {
        await get().loadNodeChildren(nodeId, nodePath)
      } else {
        set(state => ({
          expandedPaths: new Set([...state.expandedPaths, nodeId])
        }))
      }
    }
  },

  selectNode: (path: string | null) => {
    set({ selectedPath: path })
  },

  expandToPath: async (targetPath: string) => {
    const { rootNode, loadNodeChildren } = get()
    
    if (!rootNode) {
      return
    }

    // 确保根节点在 expandedPaths 中
    set(state => ({
      expandedPaths: new Set([...state.expandedPaths, 'root'])
    }))

    const normalizePath = (path: string): string => {
      return path.replace(/\\/g, '/').toLowerCase().replace(/\/$/, '')
    }

    const normalizedTarget = normalizePath(targetPath)

    const expandPath = async (node: TreeNode, remainingParts: string[], currentPath: string) => {
      if (remainingParts.length === 0) {
        set(() => ({
          selectedPath: targetPath
        }))
        return
      }

      const nextPart = remainingParts[0]
      const nextPath = currentPath ? `${currentPath}\\${nextPart}` : nextPart

      if (node.children === null && node.hasChildren) {
        await loadNodeChildren(node.id, node.path || currentPath)
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
      
      if (updatedNode?.children) {
        for (const child of updatedNode.children) {
          const childPathNormalized = normalizePath(child.path)
          const nextPathNormalized = normalizePath(nextPath)
          
          if (childPathNormalized === nextPathNormalized || child.name.toLowerCase() === nextPart.toLowerCase()) {
            set(state => ({
              expandedPaths: new Set([...state.expandedPaths, child.id])
            }))
            await expandPath(child, remainingParts.slice(1), nextPath)
            return
          }
        }
      }
    }

    for (const drive of rootNode.children || []) {
      const drivePathNormalized = normalizePath(drive.path)
      
      if (normalizedTarget === drivePathNormalized || normalizedTarget.startsWith(drivePathNormalized + '/')) {
        set(state => ({
          expandedPaths: new Set([...state.expandedPaths, drive.id])
        }))
        
        const relativePath = targetPath.slice(drive.path.length)
        const parts = relativePath.split(/[/\\]/).filter(Boolean)
        await expandPath(drive, parts, drive.path)
        break
      }
    }
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
