import { useCallback, useState } from 'react'
import { useFileListStore, type SortField } from '../stores/fileListStore'
import { useTreeStore } from '../stores/treeStore'
import { useActionLogger } from '../hooks/useActionLogger'
import { getElectronAPI } from '../utils/electronHelper'

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

  const { logClick, logInput, logSelect } = useActionLogger({
    module: 'FileListToolbar',
    componentName: 'FileListToolbar',
  })

  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filterType, setFilterType] = useState<'extension' | 'name'>('extension')
  const [filterValue, setFilterValue] = useState('')

  const files = getFilteredAndSortedFiles()

  const handleOpenDirectory = useCallback(async () => {
    logClick('打开目录按钮')
    
    const electronAPI = getElectronAPI()
    if (!electronAPI) {
      const errMsg = '当前环境不是Electron，无法使用文件系统功能'
      console.error('打开目录失败:', new Error(errMsg))
      alert(errMsg)
      return
    }
    
    try {
      const path = await electronAPI.dialog.openDirectory()
      if (path) {
        const fileListStore = useFileListStore.getState()
        const treeStore = useTreeStore.getState()
        
        fileListStore.setCurrentPath(path)
        treeStore.selectNode(path)
        
        if (!treeStore.rootNode) {
          await treeStore.initializeTree()
        }
        
        await treeStore.expandToPath(path)
      }
    } catch (err) {
      console.error('打开目录失败:', err)
      alert('打开目录失败：' + (err instanceof Error ? err.message : '未知错误'))
    }
  }, [logClick])

  const handleAddFilter = useCallback(() => {
    if (filterValue.trim()) {
      logClick('添加过滤器按钮', { type: filterType, value: filterValue })
      useFileListStore.getState().addFilter({
        type: filterType,
        value: filterValue.trim(),
      })
      setFilterValue('')
    }
  }, [filterType, filterValue, logClick])

  const handleSelectAll = useCallback(() => {
    if (selectedFiles.size === files.length) {
      logClick('取消全选按钮')
      deselectAll()
    } else {
      logClick('全选按钮')
      selectAll()
    }
  }, [selectedFiles.size, files.length, selectAll, deselectAll, logClick])

  const handleToggleFilterPanel = useCallback(() => {
    logClick('过滤面板切换按钮', { willShow: !showFilterPanel })
    setShowFilterPanel(!showFilterPanel)
  }, [showFilterPanel, logClick])

  const handleSortChange = useCallback((field: SortField) => {
    logSelect('排序字段', field)
    setSort(field)
  }, [setSort, logSelect])

  const handleSortOrderToggle = useCallback(() => {
    logClick('排序方向切换', { currentOrder: sortOrder })
    setSort(sortField)
  }, [sortField, sortOrder, setSort, logClick])

  const handleSearchChange = useCallback((value: string) => {
    logInput('搜索框', value.length > 20 ? `${value.substring(0, 20)}...` : value)
    setSearchQuery(value)
  }, [setSearchQuery, logInput])

  const handleClearSearch = useCallback(() => {
    logClick('清除搜索按钮')
    setSearchQuery('')
  }, [setSearchQuery, logClick])

  const handleFilterTypeChange = useCallback((type: 'extension' | 'name') => {
    logSelect('过滤器类型', type)
    setFilterType(type)
  }, [logSelect])

  const handleFilterValueChange = useCallback((value: string) => {
    setFilterValue(value)
  }, [])

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
            onChange={(e) => handleSortChange(e.target.value as SortField)}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="text-gray-700 bg-white">
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleSortOrderToggle}
            className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <div className="h-5 w-px bg-gray-200" />

        <button
          onClick={handleToggleFilterPanel}
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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-48 px-3 py-1.5 text-sm text-gray-900 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
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
            onChange={(e) => handleFilterTypeChange(e.target.value as 'extension' | 'name')}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700"
          >
            <option value="extension" className="text-gray-700 bg-white">扩展名</option>
            <option value="name" className="text-gray-700 bg-white">文件名</option>
          </select>
          <input
            type="text"
            placeholder={filterType === 'extension' ? '例如: jpg, png' : '输入文件名关键词'}
            value={filterValue}
            onChange={(e) => handleFilterValueChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddFilter()}
            className="flex-1 px-3 py-1 text-sm text-gray-900 bg-white border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
