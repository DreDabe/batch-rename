import { useEffect, useCallback, useState } from 'react'
import { useTreeStore, type TreeNode } from '../stores/treeStore'
import { useFileListStore } from '../stores/fileListStore'
import { createModuleLogger } from '../utils/logger'
import { useSettingsStore } from '../stores/settingsStore'

const log = createModuleLogger('TreePanel')

const debugLog = (message: string, data?: unknown) => {
  log.info(message, data)
  if (window.electronAPI?.debug?.log) {
    window.electronAPI.debug.log(`[TreePanel] ${message}`, data)
  }
}

interface TreeNodeItemProps {
  node: TreeNode
  depth: number
  onSelect: (path: string) => void
  onToggle: (nodeId: string, nodePath: string) => void
  selectedPath: string | null
  expandedPaths: Set<string>
  onDragOver: (e: React.DragEvent, nodePath: string) => void
  onDrop: (e: React.DragEvent, nodePath: string) => void
}

function TreeNodeItem({ 
  node, 
  depth, 
  onSelect, 
  onToggle, 
  selectedPath, 
  expandedPaths,
  onDragOver,
  onDrop,
  theme
}: TreeNodeItemProps & { theme: 'light' | 'dark' }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const isExpanded = expandedPaths.has(node.id)
  const isSelected = selectedPath === node.path
  const hasChildren = node.hasChildren || (node.children && node.children.length > 0)

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (node.type !== 'root') {
      debugLog('节点点击', { nodeName: node.name, nodePath: node.path, nodeId: node.id })
      onSelect(node.path)
    }
  }, [node.type, node.path, node.name, node.id, onSelect])

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    debugLog('展开/折叠按钮点击', { nodeName: node.name, nodeId: node.id, currentExpanded: isExpanded })
    onToggle(node.id, node.path)
  }, [node.id, node.path, node.name, isExpanded, onToggle])

  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    debugLog('重试按钮点击', { nodeName: node.name, nodeId: node.id })
    onToggle(node.id, node.path)
  }, [node.id, node.path, node.name, onToggle])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (node.type === 'folder' || node.type === 'drive' || node.type === 'root') {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setIsDragOver(true)
      onDragOver(e, node.path)
    }
  }, [node.type, node.path, onDragOver])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (node.type === 'folder' || node.type === 'drive' || node.type === 'root') {
      onDrop(e, node.path)
    }
  }, [node.type, node.path, onDrop])

  return (
    <div className="select-none">
      <div
        className={`flex items-center px-2 py-1 cursor-pointer transition-colors group ${
          isSelected 
            ? theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800' 
            : isDragOver
            ? theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
            : theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className={`w-4 h-4 flex items-center justify-center mr-1 flex-shrink-0 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {node.isLoading ? (
              <span className="animate-spin text-xs">⏳</span>
            ) : isExpanded ? (
              '▼'
            ) : (
              '▶'
            )}
          </button>
        ) : (
          <span className="w-4 h-4 mr-1 flex-shrink-0" />
        )}
        
        <span className="text-sm mr-2 flex-shrink-0">
          {node.icon || (node.type === 'folder' ? '📁' : '📄')}
        </span>
        
        <span className={`text-sm truncate flex-1 ${
          isSelected 
            ? theme === 'dark' ? 'text-blue-400' : 'text-blue-800'
            : theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
        }`}>
          {node.name}
        </span>
      </div>

      {node.error && (
        <div 
          className={`px-2 py-1 text-xs border-l-2 ${
            theme === 'dark' ? 'text-red-400 bg-red-900/20 border-red-700' : 'text-red-600 bg-red-50 border-red-400'
          }`}
          style={{ paddingLeft: `${depth * 16 + 24}px` }}
        >
          <div className="flex items-center justify-between">
            <span>{node.error}</span>
            <button
              onClick={handleRetry}
              className={`ml-2 underline ${
                theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-700'
              }`}
            >
              重试
            </button>
          </div>
        </div>
      )}

      {isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              onToggle={onToggle}
              selectedPath={selectedPath}
              expandedPaths={expandedPaths}
              onDragOver={onDragOver}
              onDrop={onDrop}
              theme={theme}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function TreePanel() {
  const {
    rootNode,
    selectedPath,
    expandedPaths,
    isLoading,
    error,
    isPanelCollapsed,
    initializeTree,
    toggleNode,
    selectNode,
    togglePanel,
  } = useTreeStore()
  
  const setCurrentPath = useFileListStore((state) => state.setCurrentPath)
  const { settings } = useSettingsStore()
  const { theme } = settings

  useEffect(() => {
    debugLog('TreePanel mounted, 初始化目录树')
    initializeTree()
  }, [initializeTree])

  useEffect(() => {
    debugLog('TreePanel 状态更新', { 
      expandedPaths: Array.from(expandedPaths), 
      selectedPath,
      rootNodeExists: !!rootNode,
      rootNodeChildrenCount: rootNode?.children?.length,
      expandedPathsSize: expandedPaths.size
    })
  }, [expandedPaths, selectedPath, rootNode])

  useEffect(() => {
    debugLog('TreePanel selectedPath 变化', { selectedPath })
  }, [selectedPath])

  useEffect(() => {
    debugLog('TreePanel expandedPaths 变化', { 
      expandedPaths: Array.from(expandedPaths), 
      size: expandedPaths.size 
    })
  }, [expandedPaths])

  const handleSelect = useCallback((path: string) => {
    debugLog('选择目录', { path })
    selectNode(path)
    setCurrentPath(path)
    log.info(`选择目录: ${path}`)
    
    // 更新上次打开的路径
    const { updateSettings } = useSettingsStore.getState()
    updateSettings('lastOpenedPath', path)
  }, [selectNode, setCurrentPath, log])

  const handleToggle = useCallback((nodeId: string, nodePath: string) => {
    debugLog('切换节点', { nodeId, nodePath })
    toggleNode(nodeId, nodePath)
  }, [toggleNode])

  const handleDragOver = useCallback((_e: React.DragEvent, nodePath: string) => {
    debugLog('拖拽经过节点', { nodePath })
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, nodePath: string) => {
    const filePath = e.dataTransfer.getData('text/plain')
    if (!filePath) return
    
    debugLog(`将文件 ${filePath} 拖拽到节点 ${nodePath}`)
    
    try {
      // 检查是否拖拽到自身
      if (filePath === nodePath) {
        debugLog('不能将文件拖拽到自身')
        return
      }
      
      // 检查是否拖拽到父级目录
      const fileDir = filePath.substring(0, filePath.lastIndexOf('\\'))
      if (fileDir === nodePath) {
        debugLog('不能将文件拖拽到父级目录')
        return
      }
      
      // 执行移动操作
      const result = await window.electronAPI.fs.move(filePath, nodePath)
      if (result.success) {
        debugLog(`文件移动成功: ${filePath} -> ${nodePath}`)
        // 重新加载文件列表
        const currentPath = useFileListStore.getState().currentPath
        if (currentPath) {
          const reloadResult = await window.electronAPI.fs.readDirectory(currentPath)
          if (reloadResult.success && reloadResult.data) {
            useFileListStore.getState().setFiles(reloadResult.data.files)
          }
        }
        // 重新加载树状目录
        toggleNode(nodePath, nodePath) // 刷新目标节点
      } else {
        debugLog(`文件移动失败: ${result.error}`)
      }
    } catch (err) {
      debugLog(`移动文件时出错: ${err instanceof Error ? err.message : '未知错误'}`)
    }
  }, [toggleNode])

  if (isPanelCollapsed) {
    return (
      <div className={`h-full w-full flex flex-col items-center py-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <button
          onClick={togglePanel}
          className={`w-8 h-8 flex items-center justify-center rounded mb-2 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
          title="展开面板"
        >
          ▶
        </button>
        
        <div className="flex flex-col items-center gap-1 mt-2">
          <div 
            className={`w-8 h-8 flex items-center justify-center text-lg cursor-pointer rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            title="此电脑"
          >
            💻
          </div>
          {rootNode?.children?.map((drive) => (
            <div
              key={drive.id}
              className={`w-8 h-8 flex items-center justify-center text-lg cursor-pointer rounded ${
                theme === 'dark' 
                  ? selectedPath === drive.path ? 'bg-blue-900/30' : 'hover:bg-gray-700'
                  : selectedPath === drive.path ? 'bg-blue-100' : 'hover:bg-gray-200'
              }`}
              title={drive.name}
              onClick={() => handleSelect(drive.path)}
            >
              {drive.icon}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full w-full flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <div className={`flex items-center justify-between px-3 py-2 border-b flex-shrink-0 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>文件目录</span>
        <button
          onClick={togglePanel}
          className={`w-6 h-6 flex items-center justify-center rounded ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
          title="收缩面板"
        >
          ◀
        </button>
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        {isLoading && !rootNode && (
          <div className={`flex items-center justify-center h-20 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
            <div className="animate-spin mr-2">⏳</div>
            <span className="text-sm">加载中...</span>
          </div>
        )}

        {error && (
          <div className={`flex flex-col items-center justify-center h-20 px-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-400'}`}>
            <span className="text-lg mb-1">⚠️</span>
            <span className="text-xs text-center">{error}</span>
            <button
              onClick={initializeTree}
              className={`mt-2 text-xs ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}
            >
              重试
            </button>
          </div>
        )}

        {rootNode && (
          <div className="py-1">
            <TreeNodeItem
              node={rootNode}
              depth={0}
              onSelect={handleSelect}
              onToggle={handleToggle}
              selectedPath={selectedPath}
              expandedPaths={expandedPaths}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              theme={theme}
            />
          </div>
        )}
      </div>
    </div>
  )
}
