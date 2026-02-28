import { create } from 'zustand'
import type { FileItem } from '../types'
import { createModuleLogger } from '../utils/logger'

const log = createModuleLogger('FileListStore')

export type SortField = 'name' | 'size' | 'modifiedAt' | 'extension'
export type SortOrder = 'asc' | 'desc'

export type FileFilter = {
  type: 'extension' | 'regex' | 'name'
  value: string
}

interface FileListState {
  files: FileItem[]
  selectedFiles: Set<string>
  currentPath: string | null
  isLoading: boolean
  error: string | null
  sortField: SortField
  sortOrder: SortOrder
  filters: FileFilter[]
  lastSelectedIndex: number
  searchQuery: string

  setFiles: (files: FileItem[]) => void
  setCurrentPath: (path: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  selectFile: (path: string, index: number, isCtrl: boolean, isShift: boolean) => void
  selectAll: () => void
  deselectAll: () => void
  toggleSelect: (path: string) => void
  setSort: (field: SortField) => void
  addFilter: (filter: FileFilter) => void
  removeFilter: (index: number) => void
  clearFilters: () => void
  setSearchQuery: (query: string) => void
  getFilteredAndSortedFiles: () => FileItem[]
  getSelectedFiles: () => FileItem[]
}

const getFileExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.')
  return lastDot === -1 ? '' : filename.substring(lastDot + 1).toLowerCase()
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const useFileListStore = create<FileListState>((set, get) => ({
  files: [],
  selectedFiles: new Set<string>(),
  currentPath: null,
  isLoading: false,
  error: null,
  sortField: 'name',
  sortOrder: 'asc',
  filters: [],
  lastSelectedIndex: -1,
  searchQuery: '',

  setFiles: (files) => {
    const prevFiles = get().files
    log.logStateChange({
      message: '文件列表更新',
      previousState: { count: prevFiles.length },
      newState: { count: files.length },
    })
    log.debug(`设置文件列表，共 ${files.length} 个文件`)
    set({ files, selectedFiles: new Set(), lastSelectedIndex: -1 })
  },
  setCurrentPath: (path) => {
    const prevPath = get().currentPath
    log.logAction({
      actionType: 'navigate',
      message: `切换目录`,
      previousState: { path: prevPath },
      newState: { path },
      data: { from: prevPath, to: path },
    })
    set({ currentPath: path })
  },
  setLoading: (isLoading) => {
    log.debug(`加载状态: ${isLoading}`)
    set({ isLoading })
  },
  setError: (error) => {
    if (error) {
      log.logError({
        message: '文件列表错误',
        data: { error },
      })
    }
    set({ error })
  },

  selectFile: (path, index, isCtrl, isShift) => {
    const { files, selectedFiles, lastSelectedIndex } = get()

    if (isShift && lastSelectedIndex !== -1) {
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      const newSelected = new Set(selectedFiles)

      for (let i = start; i <= end; i++) {
        newSelected.add(files[i].path)
      }

      log.logAction({
        actionType: 'select',
        message: `Shift范围选择`,
        data: { start, end, count: newSelected.size },
      })
      set({ selectedFiles: newSelected })
    } else if (isCtrl) {
      const newSelected = new Set(selectedFiles)
      if (newSelected.has(path)) {
        newSelected.delete(path)
        log.logAction({
          actionType: 'select',
          message: `Ctrl取消选择`,
          data: { path, selectedCount: newSelected.size },
        })
      } else {
        newSelected.add(path)
        log.logAction({
          actionType: 'select',
          message: `Ctrl添加选择`,
          data: { path, selectedCount: newSelected.size },
        })
      }
      set({ selectedFiles: newSelected, lastSelectedIndex: index })
    } else {
      log.logAction({
        actionType: 'select',
        message: `单选文件`,
        data: { path, index },
      })
      set({ selectedFiles: new Set([path]), lastSelectedIndex: index })
    }
  },

  selectAll: () => {
    const { files } = get()
    const count = files.length
    log.logAction({
      actionType: 'select',
      message: `全选文件`,
      data: { count },
    })
    set({ selectedFiles: new Set(files.map((f) => f.path)) })
  },

  deselectAll: () => {
    const prevSize = get().selectedFiles.size
    log.logAction({
      actionType: 'select',
      message: `取消全选`,
      data: { previousCount: prevSize },
    })
    set({ selectedFiles: new Set(), lastSelectedIndex: -1 })
  },

  toggleSelect: (path) => {
    const { selectedFiles } = get()
    const newSelected = new Set(selectedFiles)
    const wasSelected = newSelected.has(path)
    if (wasSelected) {
      newSelected.delete(path)
    } else {
      newSelected.add(path)
    }
    log.logAction({
      actionType: 'select',
      message: `切换选择状态`,
      data: { path, wasSelected, nowSelected: !wasSelected },
    })
    set({ selectedFiles: newSelected })
  },

  setSort: (field) => {
    const { sortField, sortOrder } = get()
    const newOrder = sortField === field ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc'
    log.logAction({
      actionType: 'select',
      message: `更改排序`,
      data: { field, order: newOrder },
    })
    if (sortField === field) {
      set({ sortOrder: newOrder })
    } else {
      set({ sortField: field, sortOrder: 'asc' })
    }
  },

  addFilter: (filter) => {
    const { filters } = get()
    log.logAction({
      actionType: 'input',
      message: `添加过滤器`,
      data: { filter },
    })
    set({ filters: [...filters, filter] })
  },

  removeFilter: (index) => {
    const { filters } = get()
    const removed = filters[index]
    log.logAction({
      actionType: 'delete',
      message: `移除过滤器`,
      data: { index, filter: removed },
    })
    set({ filters: filters.filter((_, i) => i !== index) })
  },

  clearFilters: () => {
    const { filters } = get()
    log.logAction({
      actionType: 'delete',
      message: `清空所有过滤器`,
      data: { count: filters.length },
    })
    set({ filters: [] })
  },

  setSearchQuery: (query) => {
    const prevQuery = get().searchQuery
    if (query !== prevQuery) {
      log.logAction({
        actionType: 'input',
        message: `搜索查询`,
        data: { query: query.substring(0, 50) },
      })
    }
    set({ searchQuery: query })
  },

  getFilteredAndSortedFiles: () => {
    const { files, sortField, sortOrder, filters, searchQuery } = get()

    let result = [...files]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((f) => f.name.toLowerCase().includes(query))
    }

    for (const filter of filters) {
      if (filter.type === 'extension') {
        const ext = filter.value.toLowerCase()
        result = result.filter((f) => getFileExtension(f.name) === ext)
      } else if (filter.type === 'regex') {
        try {
          const regex = new RegExp(filter.value, 'i')
          result = result.filter((f) => regex.test(f.name))
        } catch {
          // Invalid regex, skip filter
        }
      } else if (filter.type === 'name') {
        const name = filter.value.toLowerCase()
        result = result.filter((f) => f.name.toLowerCase().includes(name))
      }
    }

    result.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'modifiedAt':
          comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime()
          break
        case 'extension':
          comparison = getFileExtension(a.name).localeCompare(getFileExtension(b.name))
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  },

  getSelectedFiles: () => {
    const { files, selectedFiles } = get()
    return files.filter((f) => selectedFiles.has(f.path))
  },
}))

export { getFileExtension, formatFileSize }
