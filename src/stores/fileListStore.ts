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

export type ClipboardOperation = 'copy' | 'cut' | null

interface FileListState {
  files: FileItem[]
  selectedFiles: Set<string>
  previewFile: FileItem | null
  currentPath: string | null
  isLoading: boolean
  error: string | null
  sortField: SortField
  sortOrder: SortOrder
  filters: FileFilter[]
  lastSelectedIndex: number
  searchQuery: string
  pathHistory: string[]
  currentPathIndex: number
  clipboardFiles: string[]
  clipboardOperation: ClipboardOperation

  setFiles: (files: FileItem[]) => void
  setCurrentPath: (path: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  selectFile: (path: string, index: number, isCtrl: boolean, isShift: boolean) => void
  setPreviewFile: (file: FileItem | null) => void
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
  canGoBack: () => boolean
  canGoForward: () => boolean
  goBack: () => string | null
  goForward: () => string | null
  copySelected: () => void
  cutSelected: () => void
  paste: () => Promise<boolean>
  hasClipboardFiles: () => boolean
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
  previewFile: null,
  currentPath: null,
  isLoading: false,
  error: null,
  sortField: 'extension',
  sortOrder: 'asc',
  filters: [],
  lastSelectedIndex: -1,
  searchQuery: '',
  pathHistory: [],
  currentPathIndex: -1,
  clipboardFiles: [],
  clipboardOperation: null,

  setFiles: (files) => {
    const prevFiles = get().files
    log.logStateChange({
      message: '文件列表更新',
      previousState: { count: prevFiles.length },
      newState: { count: files.length },
    })
    set({ files, selectedFiles: new Set(), previewFile: null, lastSelectedIndex: -1 })
  },
  setPreviewFile: (file) => {
    log.logAction({
      actionType: 'preview',
      message: `设置预览文件`,
      data: { file: file?.name || null },
    })
    set({ previewFile: file })
  },
  setCurrentPath: (path) => {
    const prevPath = get().currentPath
    const { pathHistory, currentPathIndex } = get()
    
    log.logAction({
      actionType: 'navigate',
      message: `切换目录`,
      previousState: { path: prevPath },
      newState: { path },
      data: { from: prevPath, to: path },
    })
    
    if (path === null) {
      set({ currentPath: path })
      return
    }
    
    if (path === prevPath) {
      return
    }
    
    const newHistory = [...pathHistory.slice(0, currentPathIndex + 1), path]
    const newIndex = newHistory.length - 1
    
    set({ 
      currentPath: path,
      pathHistory: newHistory,
      currentPathIndex: newIndex
    })
  },
  setLoading: (isLoading) => {
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

  canGoBack: () => {
    const { currentPathIndex } = get()
    return currentPathIndex > 0
  },

  canGoForward: () => {
    const { currentPathIndex, pathHistory } = get()
    return currentPathIndex < pathHistory.length - 1
  },

  goBack: () => {
    const { currentPathIndex, pathHistory } = get()
    if (currentPathIndex > 0) {
      const newIndex = currentPathIndex - 1
      const path = pathHistory[newIndex]
      set({ 
        currentPath: path,
        currentPathIndex: newIndex
      })
      return path
    }
    return null
  },

  goForward: () => {
    const { currentPathIndex, pathHistory } = get()
    if (currentPathIndex < pathHistory.length - 1) {
      const newIndex = currentPathIndex + 1
      const path = pathHistory[newIndex]
      set({ 
        currentPath: path,
        currentPathIndex: newIndex
      })
      return path
    }
    return null
  },

  copySelected: () => {
    const { selectedFiles } = get()
    const files = Array.from(selectedFiles)
    log.logAction({
      actionType: 'execute',
      message: '复制文件到剪贴板',
      data: { count: files.length },
    })
    set({ 
      clipboardFiles: files,
      clipboardOperation: 'copy'
    })
  },

  cutSelected: () => {
    const { selectedFiles } = get()
    const files = Array.from(selectedFiles)
    log.logAction({
      actionType: 'execute',
      message: '剪切文件到剪贴板',
      data: { count: files.length },
    })
    set({ 
      clipboardFiles: files,
      clipboardOperation: 'cut'
    })
  },

  paste: async () => {
    const { clipboardFiles, clipboardOperation, currentPath } = get()
    
    if (!clipboardFiles.length || !clipboardOperation || !currentPath) {
      return false
    }

    log.logAction({
      actionType: 'execute',
      message: `${clipboardOperation === 'copy' ? '复制' : '移动'}文件`,
      data: { count: clipboardFiles.length, destination: currentPath },
    })

    let successCount = 0
    let failCount = 0
    const operations: { type: 'copy' | 'move'; source: string; destination: string }[] = []

    for (const filePath of clipboardFiles) {
      try {
        const fileName = filePath.substring(filePath.lastIndexOf('\\') + 1)
        const destFilePath = currentPath + '\\' + fileName
        
        if (clipboardOperation === 'copy') {
          const result = await window.electronAPI.fs.copy(filePath, currentPath)
          if (result.success) {
            successCount++
            operations.push({ type: 'copy', source: filePath, destination: destFilePath })
          } else {
            failCount++
            log.logError({
              message: '复制文件失败',
              data: { file: filePath, error: result.error },
            })
          }
        } else if (clipboardOperation === 'cut') {
          const result = await window.electronAPI.fs.move(filePath, currentPath)
          if (result.success) {
            successCount++
            operations.push({ type: 'move', source: filePath, destination: destFilePath })
          } else {
            failCount++
            log.logError({
              message: '移动文件失败',
              data: { file: filePath, error: result.error },
            })
          }
        }
      } catch (err) {
        failCount++
        log.logError({
          message: '粘贴操作异常',
          error: err,
          data: { file: filePath },
        })
      }
    }

    // 记录操作到历史记录
    if (operations.length > 0) {
      for (const op of operations) {
        if (op.type === 'move') {
          await window.electronAPI.history.recordOperation('move', {
            source: op.source,
            destination: op.destination,
          }, {
            type: 'move',
            originalPath: op.source,
            newPath: op.destination,
          })
        } else if (op.type === 'copy') {
          await window.electronAPI.history.recordOperation('copy', {
            source: op.source,
            destination: op.destination,
          }, {
            type: 'create',
            newPath: op.destination,
          })
        }
      }
    }

    if (clipboardOperation === 'cut') {
      set({ 
        clipboardFiles: [],
        clipboardOperation: null
      })
    }

    log.logAction({
      actionType: 'execute',
      message: '粘贴操作完成',
      data: { successCount, failCount },
    })

    return failCount === 0
  },

  hasClipboardFiles: () => {
    const { clipboardFiles, clipboardOperation } = get()
    return clipboardFiles.length > 0 && clipboardOperation !== null
  },
}))

export { getFileExtension, formatFileSize }
