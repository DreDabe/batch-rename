import { useCallback, useState } from 'react'
import { useFileListStore, type SortField } from '../stores/fileListStore'

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'name', label: '文件名' },
  { value: 'size', label: '大小' },
  { value: 'modifiedAt', label: '修改时间' },
  { value: 'extension', label: '类型' },
]

export function FileListToolbar() {
  const {
    currentPath,
    sortField,
    sortOrder,
    searchQuery,
    selectAll,
    deselectAll,
    setSort,
    setSearchQuery,
    getFilteredAndSortedFiles,
    selectedFiles,
  } = useFileListStore()

  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filterType, setFilterType] = useState<'extension' | 'name'>('extension')
  const [filterValue, setFilterValue] = useState('')

  const files = getFilteredAndSortedFiles()

  const handleOpenDirectory = useCallback(async () => {
    const path = await window.electronAPI.dialog.openDirectory()
    if (path) {
      useFileListStore.getState().setCurrentPath(path)
    }
  }, [])

  const handleAddFilter = useCallback(() => {
    if (filterValue.trim()) {
      useFileListStore.getState().addFilter({
        type: filterType,
        value: filterValue.trim(),
      })
      setFilterValue('')
    }
  }, [filterType, filterValue])

  const handleSelectAll = useCallback(() => {
    if (selectedFiles.size === files.length) {
      deselectAll()
    } else {
      selectAll()
    }
  }, [selectedFiles.size, files.length, selectAll, deselectAll])

  return (
    <div className="border-b bg-white">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={handleOpenDirectory}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          <span>📂</span>
          <span>打开目录</span>
        </button>

        <div className="h-5 w-px bg-gray-200" />

        <button
          onClick={handleSelectAll}
          className="px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          {selectedFiles.size === files.length ? '取消全选' : '全选'}
        </button>

        <div className="h-5 w-px bg-gray-200" />

        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">排序:</span>
          <select
            value={sortField}
            onChange={(e) => setSort(e.target.value as SortField)}
            className="text-sm border rounded px-2 py-1 bg-white"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSort(sortField)}
            className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <div className="h-5 w-px bg-gray-200" />

        <button
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className={`px-2 py-1.5 text-sm rounded transition-colors ${
            showFilterPanel ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          🔍 过滤
        </button>

        <div className="flex-1" />

        <div className="relative">
          <input
            type="text"
            placeholder="搜索文件..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {showFilterPanel && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-t">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'extension' | 'name')}
            className="text-sm border rounded px-2 py-1 bg-white"
          >
            <option value="extension">扩展名</option>
            <option value="name">文件名</option>
          </select>
          <input
            type="text"
            placeholder={filterType === 'extension' ? '例如: jpg, png' : '输入文件名关键词'}
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddFilter()}
            className="flex-1 px-3 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddFilter}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            添加
          </button>
        </div>
      )}

      {currentPath && (
        <div className="px-3 py-1.5 text-xs text-gray-500 bg-gray-50 border-t truncate">
          📁 {currentPath}
        </div>
      )}
    </div>
  )
}
