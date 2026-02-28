import { useEffect, useCallback, useMemo } from 'react'
import { useFileListStore } from '../stores/fileListStore'
import { useRuleStore } from '../stores/ruleStore'
import { createModuleLogger } from '../utils/logger'

const log = createModuleLogger('useKeyboardShortcuts')

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts() {
  const currentPath = useFileListStore((state) => state.currentPath)
  const setCurrentPath = useFileListStore((state) => state.setCurrentPath)
  const selectAll = useFileListStore((state) => state.selectAll)
  const getSelectedFiles = useFileListStore((state) => state.getSelectedFiles)
  const setFiles = useFileListStore((state) => state.setFiles)
  const setLoading = useFileListStore((state) => state.setLoading)
  const setError = useFileListStore((state) => state.setError)
  const previews = useRuleStore((state) => state.previews)
  const clearPreviews = useRuleStore((state) => state.clearPreviews)

  const handleOpenDirectory = useCallback(async () => {
    log.info('快捷键: Ctrl+O 打开目录')
    const path = await window.electronAPI.dialog.openDirectory()
    if (path) {
      setCurrentPath(path)
    }
  }, [setCurrentPath])

  const handleSelectAll = useCallback(() => {
    log.info('快捷键: Ctrl+A 全选')
    selectAll()
  }, [selectAll])

  const handleUndo = useCallback(async () => {
    log.info('快捷键: Ctrl+Z 撤销')
    const result = await window.electronAPI.history.undo()
    if (result.success) {
      if (currentPath) {
        const refreshResult = await window.electronAPI.fs.readDirectory(currentPath)
        if (refreshResult.success && refreshResult.data) {
          setFiles(refreshResult.data.files)
        }
      }
    }
  }, [currentPath, setFiles])

  const handleDelete = useCallback(async () => {
    const selectedFiles = getSelectedFiles()
    if (selectedFiles.length === 0) return

    log.info(`快捷键: Delete 删除 ${selectedFiles.length} 个文件`)
    const confirmed = confirm(`确定要删除 ${selectedFiles.length} 个文件吗？`)
    if (!confirmed) return

    for (const file of selectedFiles) {
      await window.electronAPI.fs.delete(file.path, true)
    }

    if (currentPath) {
      const result = await window.electronAPI.fs.readDirectory(currentPath)
      if (result.success && result.data) {
        setFiles(result.data.files)
      }
    }
  }, [getSelectedFiles, currentPath, setFiles])

  const handleRefresh = useCallback(async () => {
    if (!currentPath) return

    log.info('快捷键: F5 刷新')
    setLoading(true)
    const result = await window.electronAPI.fs.readDirectory(currentPath)
    if (result.success && result.data) {
      setFiles(result.data.files)
    } else {
      setError(result.error || '刷新失败')
    }
    setLoading(false)
  }, [currentPath, setFiles, setLoading, setError])

  const handleExecuteRename = useCallback(async () => {
    const conflictCount = previews.filter((p) => p.hasConflict).length
    if (conflictCount > 0) {
      log.warn('快捷键: Enter 执行重命名 - 存在冲突，无法执行')
      return
    }

    log.info(`快捷键: Enter 执行重命名 ${previews.length} 个文件`)
    const { executeRename } = useRuleStore.getState()
    await executeRename()
    clearPreviews()

    if (currentPath) {
      const result = await window.electronAPI.fs.readDirectory(currentPath)
      if (result.success && result.data) {
        setFiles(result.data.files)
      }
    }
  }, [previews, currentPath, setFiles, clearPreviews])

  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    { key: 'o', ctrlKey: true, action: handleOpenDirectory, description: '打开目录' },
    { key: 'a', ctrlKey: true, action: handleSelectAll, description: '全选' },
    { key: 'z', ctrlKey: true, action: handleUndo, description: '撤销' },
    { key: 'Delete', action: handleDelete, description: '删除' },
    { key: 'F5', action: handleRefresh, description: '刷新' },
    { key: 'Enter', ctrlKey: true, action: handleExecuteRename, description: '执行重命名' },
  ], [handleOpenDirectory, handleSelectAll, handleUndo, handleDelete, handleRefresh, handleExecuteRename])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase() || e.key === shortcut.key
        const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey
        const altMatch = shortcut.altKey ? e.altKey : !e.altKey

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault()
          log.debug(`触发快捷键: ${shortcut.description}`)
          shortcut.action()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])

  return { shortcuts }
}

export function ShortcutHelp() {
  const shortcuts = [
    { keys: 'Ctrl+O', description: '打开目录' },
    { keys: 'Ctrl+A', description: '全选' },
    { keys: 'Ctrl+Z', description: '撤销' },
    { keys: 'Delete', description: '删除选中' },
    { keys: 'F5', description: '刷新列表' },
    { keys: 'Ctrl+Enter', description: '执行重命名' },
  ]

  return (
    <div className="text-xs text-gray-400 space-y-1">
      {shortcuts.map((s) => (
        <div key={s.keys} className="flex justify-between">
          <kbd className="px-1 bg-gray-100 rounded">{s.keys}</kbd>
          <span>{s.description}</span>
        </div>
      ))}
    </div>
  )
}
