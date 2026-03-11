import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFileListStore, formatFileSize } from '../stores/fileListStore'
import { getFileIcon, getFileTypeLabel } from '../utils/fileIcons'
import { createModuleLogger } from '../utils/logger'
import { Tooltip } from './Tooltip'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import type { FileItem } from '../types'

const log = createModuleLogger('FileList')

const ITEM_HEIGHT = 56
const OVERSCAN = 5

interface VirtualListProps {
  items: FileItem[]
  itemHeight: number
  renderItem: (item: FileItem, index: number) => React.ReactNode
}

function VirtualList({ items, itemHeight, renderItem }: VirtualListProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(600)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    
    const updateHeight = () => {
      const height = containerRef.current!.clientHeight
      if (height > 0) {
        setContainerHeight(height)
      }
    }
    
    updateHeight()
    
    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(containerRef.current)
    
    return () => resizeObserver.disconnect()
  }, [])

  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - OVERSCAN)
  const endIndex = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + OVERSCAN)

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, i) => ({
      item,
      index: startIndex + i,
    }))
  }, [items, startIndex, endIndex])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return (
    <div
      ref={containerRef}
      className="overflow-auto h-full"
      onScroll={handleScroll}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9',
      }}
    >
      <style>{`
        .overflow-auto::-webkit-scrollbar {
          width: 8px;
        }
        .overflow-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .overflow-auto::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 4px;
        }
        .overflow-auto::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={item.path}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

interface FileListItemProps {
  file: FileItem
  index: number
  isSelected: boolean
  onSelect: (path: string, index: number, isCtrl: boolean, isShift: boolean) => void
  onDoubleClick: (file: FileItem) => void
  onDragStart: (e: React.DragEvent, file: FileItem) => void
  onDragEnd: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent, folderPath: string) => void
  onDrop: (e: React.DragEvent, folderPath: string) => void
}

function FileListItem({ file, index, isSelected, onSelect, onDoubleClick, onDragStart, onDragEnd, onDragOver, onDrop }: FileListItemProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleClick = useCallback((e: React.MouseEvent) => {
    onSelect(file.path, index, e.ctrlKey || e.metaKey, e.shiftKey)
  }, [file.path, index, onSelect])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDoubleClick(file)
  }, [file, onDoubleClick])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (file.isDirectory) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setIsDragOver(true)
      onDragOver(e, file.path)
    }
  }, [file.isDirectory, file.path, onDragOver])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (file.isDirectory) {
      onDrop(e, file.path)
    }
  }, [file.isDirectory, file.path, onDrop])

  const icon = getFileIcon(file.name, file.isDirectory)
  const typeLabel = getFileTypeLabel(file.name, file.isDirectory)

  return (
    <div
      className={`flex items-start px-3 py-1.5 cursor-pointer border-b border-gray-100 transition-colors select-none ${ 
        isSelected
          ? 'bg-blue-50 border-l-2 border-l-blue-500'
          : isDragOver && file.isDirectory
          ? 'bg-green-50 border-l-2 border-l-green-500'
          : 'hover:bg-gray-50 border-l-2 border-l-transparent'
      }`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      draggable={!file.isDirectory} // 只允许文件拖拽，不允许文件夹拖拽
      onDragStart={(e) => onDragStart(e, file)}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className="text-xl mr-3 flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between">
          <Tooltip content={file.name}>
            <div className="text-sm font-medium text-gray-900 truncate flex-1 min-w-0">
              {file.name}
            </div>
          </Tooltip>
          <div className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap ml-2 w-16 text-right">
            {file.isDirectory ? '--' : formatFileSize(file.size)}
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{typeLabel}</div>
      </div>
    </div>
  )
}

export function FileList() {
  useKeyboardShortcuts()
  
  const {
    currentPath,
    isLoading,
    error,
    selectedFiles,
    setFiles,
    setLoading,
    setError,
    selectFile,
    setPreviewFile,
    getFilteredAndSortedFiles,
    setCurrentPath,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    copySelected,
    cutSelected,
    paste,
    hasClipboardFiles,
  } = useFileListStore()

  const files = getFilteredAndSortedFiles()

  const handleGoBack = useCallback(() => {
    goBack()
  }, [goBack])

  const handleGoForward = useCallback(() => {
    goForward()
  }, [goForward])

  const handleCopy = useCallback(() => {
    copySelected()
  }, [copySelected])

  const handleCut = useCallback(() => {
    cutSelected()
  }, [cutSelected])

  const handlePaste = useCallback(async () => {
    const success = await paste()
    if (success) {
      // 重新加载文件列表
      if (currentPath) {
        const result = await window.electronAPI.fs.readDirectory(currentPath)
        if (result.success && result.data) {
          setFiles(result.data.files)
        }
      }
    }
  }, [paste, currentPath, setFiles])

  const handleUndo = useCallback(async () => {
    const result = await window.electronAPI.history.undo()
    if (result.success) {
      // 重新加载文件列表
      if (currentPath) {
        const reloadResult = await window.electronAPI.fs.readDirectory(currentPath)
        if (reloadResult.success && reloadResult.data) {
          setFiles(reloadResult.data.files)
        }
      }
    }
  }, [currentPath, setFiles])

  const handleDoubleClick = useCallback((file: FileItem) => {
    if (file.isDirectory) {
      setCurrentPath(file.path)
    } else {
      setPreviewFile(file)
    }
  }, [setPreviewFile, setCurrentPath])

  const handleDragStart = useCallback((e: React.DragEvent, file: FileItem) => {
    if (file.isDirectory) return
    
    // 设置拖拽数据
    e.dataTransfer.setData('text/plain', file.path)
    e.dataTransfer.effectAllowed = 'move'
    
    // 添加拖拽视觉效果
    const dragImage = document.createElement('div')
    dragImage.className = 'bg-white p-2 rounded shadow-md border border-gray-200'
    dragImage.innerHTML = `
      <div class="flex items-center">
        <span class="text-lg mr-2">${getFileIcon(file.name, false)}</span>
        <span class="text-sm font-medium">${file.name}</span>
      </div>
    `
    dragImage.style.position = 'absolute'
    dragImage.style.left = '-9999px'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 20, 20)
    
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 0)
  }, [])

  const handleDragEnd = useCallback(() => {
  }, [])

  const handleDragOver = useCallback((_e: React.DragEvent, _folderPath: string) => {
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, folderPath: string) => {
    const filePath = e.dataTransfer.getData('text/plain')
    if (!filePath) return
    
    try {
      // 检查是否拖拽到自身
      if (filePath === folderPath) {
        return
      }
      
      // 检查是否拖拽到父级目录
      const fileDir = filePath.substring(0, filePath.lastIndexOf('\\'))
      if (fileDir === folderPath) {
        return
      }
      
      // 执行移动操作
      const result = await window.electronAPI.fs.move(filePath, folderPath)
      if (result.success) {
        // 重新加载文件列表
        if (currentPath) {
          const reloadResult = await window.electronAPI.fs.readDirectory(currentPath)
          if (reloadResult.success && reloadResult.data) {
            setFiles(reloadResult.data.files)
          }
        }
      }
    } catch (err) {
      // 忽略错误，由fileSystemService处理
    }
  }, [currentPath, setFiles])

  useEffect(() => {
    const loadFiles = async () => {
      if (!currentPath) {
        setFiles([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await window.electronAPI.fs.readDirectory(currentPath)
        if (result.success && result.data) {
          setFiles(result.data.files)
        } else {
          setError(result.error || '读取目录失败')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误')
      } finally {
        setLoading(false)
      }
    }

    loadFiles()
  }, [currentPath, setFiles, setLoading, setError])

  if (!currentPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <span className="text-4xl mb-2">📂</span>
        <span className="text-sm">请选择一个目录</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <div className="animate-spin text-3xl mb-2">⏳</div>
        <span className="text-sm">加载中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-400">
        <span className="text-4xl mb-2">⚠️</span>
        <span className="text-sm">{error}</span>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <span className="text-4xl mb-2">📭</span>
        <span className="text-sm">目录为空</span>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center gap-1 px-3 py-2 border-b bg-gray-50 flex-shrink-0">
        <button
          onClick={handleGoBack}
          disabled={!canGoBack()}
          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          title="返回"
        >
          ←
        </button>
        <button
          onClick={handleGoForward}
          disabled={!canGoForward()}
          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          title="前进"
        >
          →
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button
          onClick={handleCopy}
          disabled={selectedFiles.size === 0}
          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          title="复制"
        >
          📋
        </button>
        <button
          onClick={handleCut}
          disabled={selectedFiles.size === 0}
          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          title="剪切"
        >
          ✂️
        </button>
        <button
          onClick={handlePaste}
          disabled={!hasClipboardFiles()}
          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          title="粘贴"
        >
          📥
        </button>
        <button
          onClick={handleUndo}
          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded"
          title="撤销 (Ctrl+Z)"
        >
          ↩️
        </button>
        <div className="flex-1 text-xs text-gray-500 truncate ml-2">
          {currentPath || '请选择目录'}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <VirtualList
          items={files}
          itemHeight={ITEM_HEIGHT}
          renderItem={(file, index) => (
            <FileListItem
              key={file.path}
              file={file}
              index={index}
              isSelected={selectedFiles.has(file.path)}
              onSelect={selectFile}
              onDoubleClick={handleDoubleClick}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          )}
        />
      </div>
      <div className="px-3 py-2 text-xs text-gray-500 border-t bg-gray-50 flex-shrink-0">
        共 {files.length} 项，已选择 {selectedFiles.size} 项
      </div>
    </div>
  )
}
