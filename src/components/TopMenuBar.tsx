import { useState, useCallback } from 'react'
import { useFileListStore } from '../stores/fileListStore'
import { createModuleLogger } from '../utils/logger'
import { SettingsModal } from './SettingsModal'

const log = createModuleLogger('TopMenuBar')

interface MenuItem {
  id: string
  label: string
  icon: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}

export function TopMenuBar() {
  const [showSettings, setShowSettings] = useState(false)
  const currentPath = useFileListStore((state) => state.currentPath)
  const selectedFiles = useFileListStore((state) => state.getSelectedFiles())
  const setCurrentPath = useFileListStore((state) => state.setCurrentPath)
  const setFiles = useFileListStore((state) => state.setFiles)

  const handleOpenDirectory = useCallback(async () => {
    log.info('打开目录对话框')
    const path = await window.electronAPI.dialog.openDirectory()
    if (path) {
      log.info(`选择目录: ${path}`)
      setCurrentPath(path)
    }
  }, [setCurrentPath])

  const handleCreateFolder = useCallback(async () => {
    if (!currentPath) return

    const name = prompt('请输入文件夹名称')
    if (!name) return

    log.info(`创建文件夹: ${name}`)
    const result = await window.electronAPI.fs.createFolder(currentPath, name)
    if (result.success) {
      log.info('创建成功，刷新列表')
      const refreshResult = await window.electronAPI.fs.readDirectory(currentPath)
      if (refreshResult.success && refreshResult.data) {
        setFiles(refreshResult.data.files)
      }
    } else {
      log.error(`创建失败: ${result.error}`)
      alert(result.error || '创建失败')
    }
  }, [currentPath, setFiles])

  const handleDelete = useCallback(async () => {
    if (selectedFiles.length === 0) return

    const confirmed = confirm(`确定要删除 ${selectedFiles.length} 个文件吗？`)
    if (!confirmed) return

    log.info(`删除 ${selectedFiles.length} 个文件`)
    for (const file of selectedFiles) {
      await window.electronAPI.fs.delete(file.path, true)
    }

    if (currentPath) {
      const result = await window.electronAPI.fs.readDirectory(currentPath)
      if (result.success && result.data) {
        setFiles(result.data.files)
      }
    }
  }, [selectedFiles, currentPath, setFiles])

  const handleAddFavorite = useCallback(async () => {
    if (!currentPath) return
    log.info(`添加收藏: ${currentPath}`)
    await window.electronAPI.config.addFavorite(currentPath)
    alert('已添加到收藏夹')
  }, [currentPath])

  const menuItems: MenuItem[] = [
    { id: 'open', label: '打开目录', icon: '📂', onClick: handleOpenDirectory },
    { id: 'newFolder', label: '新建文件夹', icon: '📁', onClick: handleCreateFolder, disabled: !currentPath },
    { id: 'delete', label: '删除', icon: '🗑️', onClick: handleDelete, disabled: selectedFiles.length === 0, danger: true },
    { id: 'favorite', label: '添加收藏', icon: '⭐', onClick: handleAddFavorite, disabled: !currentPath },
    { id: 'settings', label: '设置', icon: '⚙️', onClick: () => setShowSettings(true) },
  ]

  return (
    <>
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border-b">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            disabled={item.disabled}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded transition-colors ${
              item.disabled
                ? 'text-gray-300 cursor-not-allowed'
                : item.danger
                ? 'text-red-500 hover:bg-red-50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  )
}
