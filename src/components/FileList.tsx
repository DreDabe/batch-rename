import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFileListStore, formatFileSize } from '../stores/fileListStore'
import { getFileIcon, getFileTypeLabel } from '../utils/fileIcons'
import { createModuleLogger } from '../utils/logger'
import type { FileItem } from '../types'

const log = createModuleLogger('FileList')

const ITEM_HEIGHT = 40
const OVERSCAN = 5

interface VirtualListProps {
  items: FileItem[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: FileItem, index: number) => React.ReactNode
}

function VirtualList({ items, itemHeight, containerHeight, renderItem }: VirtualListProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

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
    >
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
}

function FileListItem({ file, index, isSelected, onSelect }: FileListItemProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    onSelect(file.path, index, e.ctrlKey || e.metaKey, e.shiftKey)
  }, [file.path, index, onSelect])

  const icon = getFileIcon(file.name, file.isDirectory)
  const typeLabel = getFileTypeLabel(file.name, file.isDirectory)

  return (
    <div
      className={`flex items-center px-3 py-2 cursor-pointer border-b border-gray-100 transition-colors ${
        isSelected
          ? 'bg-blue-50 border-l-2 border-l-blue-500'
          : 'hover:bg-gray-50 border-l-2 border-l-transparent'
      }`}
      onClick={handleClick}
    >
      <span className="text-xl mr-3 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
        <div className="text-xs text-gray-500">{typeLabel}</div>
      </div>
      <div className="text-xs text-gray-400 ml-2 flex-shrink-0">
        {file.isDirectory ? '--' : formatFileSize(file.size)}
      </div>
    </div>
  )
}

export function FileList() {
  const {
    currentPath,
    isLoading,
    error,
    selectedFiles,
    setFiles,
    setLoading,
    setError,
    selectFile,
    getFilteredAndSortedFiles,
  } = useFileListStore()

  const files = getFilteredAndSortedFiles()

  useEffect(() => {
    const loadFiles = async () => {
      if (!currentPath) {
        setFiles([])
        return
      }

      log.info(`开始加载目录: ${currentPath}`)
      setLoading(true)
      setError(null)

      try {
        const result = await window.electronAPI.fs.readDirectory(currentPath)
        if (result.success && result.data) {
          log.info(`加载成功，共 ${result.data.files.length} 个文件`)
          setFiles(result.data.files)
        } else {
          log.error(`加载失败: ${result.error}`)
          setError(result.error || '读取目录失败')
        }
      } catch (err) {
        log.error(`加载异常: ${err instanceof Error ? err.message : '未知错误'}`)
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
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <VirtualList
          items={files}
          itemHeight={ITEM_HEIGHT}
          containerHeight={600}
          renderItem={(file, index) => (
            <FileListItem
              key={file.path}
              file={file}
              index={index}
              isSelected={selectedFiles.has(file.path)}
              onSelect={selectFile}
            />
          )}
        />
      </div>
      <div className="px-3 py-2 text-xs text-gray-500 border-t bg-gray-50">
        共 {files.length} 项，已选择 {selectedFiles.size} 项
      </div>
    </div>
  )
}
