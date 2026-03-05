import { useEffect, useCallback } from 'react'
import { useTreeStore, type TreeNode } from '../stores/treeStore'
import { useFileListStore } from '../stores/fileListStore'
import { createModuleLogger } from '../utils/logger'

const log = createModuleLogger('TreePanel')

interface TreeNodeItemProps {
  node: TreeNode
  depth: number
  onSelect: (path: string) => void
  onToggle: (nodeId: string, nodePath: string) => void
  selectedPath: string | null
  expandedPaths: Set<string>
}

function TreeNodeItem({ 
  node, 
  depth, 
  onSelect, 
  onToggle, 
  selectedPath, 
  expandedPaths 
}: TreeNodeItemProps) {
  const isExpanded = expandedPaths.has(node.id)
  const isSelected = selectedPath === node.path
  const hasChildren = node.hasChildren || (node.children && node.children.length > 0)

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (node.type !== 'root') {
      onSelect(node.path)
    }
  }, [node.type, node.path, onSelect])

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle(node.id, node.path)
  }, [node.id, node.path, onToggle])

  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle(node.id, node.path)
  }, [node.id, node.path, onToggle])

  return (
    <div className="select-none">
      <div
        className={`flex items-center px-2 py-1 cursor-pointer transition-colors group ${
          isSelected 
            ? 'bg-blue-100 text-blue-800' 
            : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700 mr-1 flex-shrink-0"
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
          isSelected ? 'text-blue-800' : 'text-gray-900'
        }`}>
          {node.name}
        </span>
      </div>

      {node.error && (
        <div 
          className="px-2 py-1 text-xs text-red-600 bg-red-50 border-l-2 border-red-400"
          style={{ paddingLeft: `${depth * 16 + 24}px` }}
        >
          <div className="flex items-center justify-between">
            <span>{node.error}</span>
            <button
              onClick={handleRetry}
              className="ml-2 text-blue-500 hover:text-blue-700 underline"
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
    panelWidth,
    isPanelCollapsed,
    initializeTree,
    toggleNode,
    selectNode,
    togglePanel,
  } = useTreeStore()

  const setCurrentPath = useFileListStore((state) => state.setCurrentPath)

  useEffect(() => {
    initializeTree()
  }, [initializeTree])

  const handleSelect = useCallback((path: string) => {
    selectNode(path)
    setCurrentPath(path)
    log.info(`选择目录: ${path}`)
  }, [selectNode, setCurrentPath, log])

  const handleToggle = useCallback((nodeId: string, nodePath: string) => {
    toggleNode(nodeId, nodePath)
  }, [toggleNode])

  if (isPanelCollapsed) {
    return (
      <div 
        className="flex flex-col items-center py-2 bg-gray-50 border-r"
        style={{ width: '40px' }}
      >
        <button
          onClick={togglePanel}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded mb-2"
          title="展开面板"
        >
          ▶
        </button>
        
        <div className="flex flex-col items-center gap-1 mt-2">
          <div 
            className="w-8 h-8 flex items-center justify-center text-lg cursor-pointer hover:bg-gray-200 rounded"
            title="此电脑"
          >
            💻
          </div>
          {rootNode?.children?.map((drive) => (
            <div
              key={drive.id}
              className={`w-8 h-8 flex items-center justify-center text-lg cursor-pointer hover:bg-gray-200 rounded ${
                selectedPath === drive.path ? 'bg-blue-100' : ''
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
    <div 
      className="flex flex-col h-full bg-white border-r overflow-hidden"
      style={{ width: `${panelWidth}px`, minWidth: '150px', maxWidth: '400px' }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
        <span className="text-sm font-medium text-gray-700">文件目录</span>
        <button
          onClick={togglePanel}
          className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
          title="收缩面板"
        >
          ◀
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading && !rootNode && (
          <div className="flex items-center justify-center h-20 text-gray-400">
            <div className="animate-spin mr-2">⏳</div>
            <span className="text-sm">加载中...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-20 text-red-400 px-4">
            <span className="text-lg mb-1">⚠️</span>
            <span className="text-xs text-center">{error}</span>
            <button
              onClick={initializeTree}
              className="mt-2 text-xs text-blue-500 hover:text-blue-600"
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
            />
          </div>
        )}
      </div>
    </div>
  )
}
