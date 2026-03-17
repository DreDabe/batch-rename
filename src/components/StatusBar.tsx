import { useFileListStore } from '../stores/fileListStore'
import { useRuleStore } from '../stores/ruleStore'
import { LogViewerButton } from './LogViewer'
import { useSettingsStore } from '../stores/settingsStore'

export function StatusBar() {
  const files = useFileListStore((state) => state.files)
  const selectedFiles = useFileListStore((state) => state.getSelectedFiles())
  const currentPath = useFileListStore((state) => state.currentPath)
  const isLoading = useFileListStore((state) => state.isLoading)
  const error = useFileListStore((state) => state.error)
  const previews = useRuleStore((state) => state.previews)
  const isExecuting = useRuleStore((state) => state.isExecuting)
  const { settings } = useSettingsStore()
  const { theme } = settings

  const conflictCount = previews.filter((p) => p.hasConflict).length

  return (
    <div className={`flex items-center justify-between px-4 py-1.5 border-t text-xs ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
      <div className="flex items-center gap-4">
        {currentPath ? (
          <span>📁 {currentPath}</span>
        ) : (
          <span>未选择目录</span>
        )}
        {isLoading && <span className="text-blue-400">加载中...</span>}
        {error && <span className="text-red-400">错误: {error}</span>}
      </div>

      <div className="flex items-center gap-4">
        {files.length > 0 && (
          <span>共 {files.length} 项</span>
        )}
        {selectedFiles.length > 0 && (
          <span className="text-blue-400">已选 {selectedFiles.length} 项</span>
        )}
        {previews.length > 0 && (
          <span className={conflictCount > 0 ? 'text-red-400' : 'text-green-400'}>
            预览 {previews.length} 项
            {conflictCount > 0 && ` (${conflictCount} 冲突)`}
          </span>
        )}
        {isExecuting && (
          <span className="text-orange-400">执行中...</span>
        )}
        <LogViewerButton />
      </div>
    </div>
  )
}
