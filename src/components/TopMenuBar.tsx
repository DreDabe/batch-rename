import { useState, useCallback } from 'react'
import { useFileListStore } from '../stores/fileListStore'
import { useActionLogger } from '../hooks/useActionLogger'
import { SettingsModal } from './SettingsModal'

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

  const { logClick, logAction, logError } = useActionLogger({
    module: 'TopMenuBar',
    componentName: 'TopMenuBar',
  })

  const handleOpenDirectory = useCallback(async () => {
    logClick('打开目录菜单项')
    logAction({
      actionType: 'navigate',
      message: '打开目录对话框',
    })
    const path = await window.electronAPI.dialog.openDirectory()
    if (path) {
      logAction({
        actionType: 'navigate',
        message: `选择目录`,
        data: { path },
      })
      setCurrentPath(path)
    }
  }, [setCurrentPath, logClick, logAction])

  const handleCreateFolder = useCallback(async () => {
    if (!currentPath) return

    logClick('新建文件夹菜单项')
    const name = prompt('请输入文件夹名称')
    if (!name) return

    logAction({
      actionType: 'create',
      message: '创建文件夹',
      data: { name, parentPath: currentPath },
    })

    const result = await window.electronAPI.fs.createFolder(currentPath, name)
    if (result.success) {
      logAction({
        actionType: 'create',
        message: '文件夹创建成功，刷新列表',
        data: { name },
      })
      const refreshResult = await window.electronAPI.fs.readDirectory(currentPath)
      if (refreshResult.success && refreshResult.data) {
        setFiles(refreshResult.data.files)
      }
    } else {
      logError({
        message: '创建文件夹失败',
        data: { name, error: result.error },
      })
      alert(result.error || '创建失败')
    }
  }, [currentPath, setFiles, logClick, logAction, logError])

  const handleDelete = useCallback(async () => {
    if (selectedFiles.length === 0) return

    logClick('删除菜单项')
    const confirmed = confirm(`确定要删除 ${selectedFiles.length} 个文件吗？`)
    if (!confirmed) {
      logAction({
        actionType: 'delete',
        message: '用户取消删除操作',
      })
      return
    }

    logAction({
      actionType: 'delete',
      message: `删除文件`,
      data: { count: selectedFiles.length, files: selectedFiles.map(f => f.name) },
    })

    for (const file of selectedFiles) {
      await window.electronAPI.fs.delete(file.path, true)
    }

    if (currentPath) {
      const result = await window.electronAPI.fs.readDirectory(currentPath)
      if (result.success && result.data) {
        setFiles(result.data.files)
      }
    }
  }, [selectedFiles, currentPath, setFiles, logClick, logAction])

  const handleAddFavorite = useCallback(async () => {
    if (!currentPath) return
    logClick('添加收藏菜单项')
    logAction({
      actionType: 'save',
      message: `添加收藏`,
      data: { path: currentPath },
    })
    await window.electronAPI.config.addFavorite(currentPath)
    alert('已添加到收藏夹')
  }, [currentPath, logClick, logAction])

  const handleOpenSettings = useCallback(() => {
    logClick('设置菜单项')
    logAction({
      actionType: 'navigate',
      message: '打开设置对话框',
    })
    setShowSettings(true)
  }, [logClick, logAction])

  const handleCloseSettings = useCallback(() => {
    logAction({
      actionType: 'navigate',
      message: '关闭设置对话框',
    })
    setShowSettings(false)
  }, [logAction])

  const menuItems: MenuItem[] = [
    { id: 'open', label: '打开目录', icon: '📂', onClick: handleOpenDirectory },
    { id: 'newFolder', label: '新建文件夹', icon: '📁', onClick: handleCreateFolder, disabled: !currentPath },
    { id: 'delete', label: '删除', icon: '🗑️', onClick: handleDelete, disabled: selectedFiles.length === 0, danger: true },
    { id: 'favorite', label: '添加收藏', icon: '⭐', onClick: handleAddFavorite, disabled: !currentPath },
    { id: 'settings', label: '设置', icon: '⚙️', onClick: handleOpenSettings },
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
        <SettingsModal onClose={handleCloseSettings} />
      )}
    </>
  )
}
