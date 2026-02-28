import { useState, useCallback, useEffect } from 'react'
import { useActionLogger } from '../hooks/useActionLogger'

interface FavoriteItem {
  path: string
  name: string
}

export function FavoritesPanel() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isExpanded, setIsExpanded] = useState(true)

  const { logClick, logAction } = useActionLogger({
    module: 'FavoritesPanel',
    componentName: 'FavoritesPanel',
  })

  const loadFavorites = useCallback(async () => {
    const result = await window.electronAPI.config.get()
    if (result.favorites) {
      const items = result.favorites.map((path: string) => ({
        path,
        name: path.split(/[/\\]/).pop() || path,
      }))
      setFavorites(items)
    }
  }, [])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  const handleAddFavorite = useCallback(async () => {
    logClick('添加收藏按钮')
    const path = await window.electronAPI.dialog.openDirectory()
    if (path) {
      logAction({
        actionType: 'save',
        message: '添加收藏',
        data: { path },
      })
      await window.electronAPI.config.addFavorite(path)
      loadFavorites()
    }
  }, [loadFavorites, logClick, logAction])

  const handleRemoveFavorite = useCallback(async (path: string) => {
    logClick('移除收藏按钮', { path })
    logAction({
      actionType: 'delete',
      message: '移除收藏',
      data: { path },
    })
    await window.electronAPI.config.removeFavorite(path)
    loadFavorites()
  }, [loadFavorites, logClick, logAction])

  const handleSelectFavorite = useCallback(async (path: string) => {
    logClick('选择收藏项', { path })
    logAction({
      actionType: 'navigate',
      message: '从收藏夹选择目录',
      data: { path },
    })
    const { useFileListStore } = await import('../stores/fileListStore')
    useFileListStore.getState().setCurrentPath(path)
  }, [logClick, logAction])

  const handleToggleExpand = useCallback(() => {
    logClick(isExpanded ? '折叠收藏夹' : '展开收藏夹')
    setIsExpanded(!isExpanded)
  }, [isExpanded, logClick])

  if (!isExpanded) {
    return (
      <div className="border-b bg-white">
        <button
          onClick={handleToggleExpand}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <span>⭐ 收藏夹</span>
          <span>▶</span>
        </button>
      </div>
    )
  }

  return (
    <div className="border-b bg-white">
      <button
        onClick={handleToggleExpand}
        className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
      >
        <span>⭐ 收藏夹</span>
        <span>▼</span>
      </button>

      <div className="px-2 pb-2">
        {favorites.length === 0 ? (
          <div className="text-xs text-gray-400 py-2 text-center">
            暂无收藏
          </div>
        ) : (
          <ul className="space-y-0.5">
            {favorites.map((fav) => (
              <li
                key={fav.path}
                className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer"
              >
                <span
                  className="flex-1 truncate text-sm text-gray-700"
                  onClick={() => handleSelectFavorite(fav.path)}
                >
                  📁 {fav.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFavorite(fav.path)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={handleAddFavorite}
          className="w-full mt-1 px-2 py-1.5 text-xs text-blue-500 hover:bg-blue-50 rounded"
        >
          + 添加收藏
        </button>
      </div>
    </div>
  )
}
