import { useState, useCallback } from 'react'
import { useFileListStore } from '../stores/fileListStore'

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
    const path = await window.electronAPI.dialog.openDirectory()
    if (path) {
      setCurrentPath(path)
    }
  }, [setCurrentPath])

  const handleCreateFolder = useCallback(async () => {
    if (!currentPath) return

    const name = prompt('请输入文件夹名称')
    if (!name) return

    const result = await window.electronAPI.fs.createFolder(currentPath, name)
    if (result.success) {
      const refreshResult = await window.electronAPI.fs.readDirectory(currentPath)
      if (refreshResult.success && refreshResult.data) {
        setFiles(refreshResult.data.files)
      }
    } else {
      alert(result.error || '创建失败')
    }
  }, [currentPath, setFiles])

  const handleDelete = useCallback(async () => {
    if (selectedFiles.length === 0) return

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
  }, [selectedFiles, currentPath, setFiles])

  const handleAddFavorite = useCallback(async () => {
    if (!currentPath) return
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

function SettingsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-medium">设置</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-500 text-center">设置功能开发中...</p>
        </div>
        <div className="px-4 py-3 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
