import { useFileListStore } from '../stores/fileListStore'
import { useRuleStore } from '../stores/ruleStore'

export function StatusBar() {
  const files = useFileListStore((state) => state.files)
  const selectedFiles = useFileListStore((state) => state.getSelectedFiles())
  const currentPath = useFileListStore((state) => state.currentPath)
  const isLoading = useFileListStore((state) => state.isLoading)
  const error = useFileListStore((state) => state.error)
  const previews = useRuleStore((state) => state.previews)
  const isExecuting = useRuleStore((state) => state.isExecuting)

  const conflictCount = previews.filter((p) => p.hasConflict).length

  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-gray-100 border-t text-xs text-gray-500">
      <div className="flex items-center gap-4">
        {currentPath ? (
          <span>📁 {currentPath}</span>
        ) : (
          <span>未选择目录</span>
        )}
        {isLoading && <span className="text-blue-500">加载中...</span>}
        {error && <span className="text-red-500">错误: {error}</span>}
      </div>

      <div className="flex items-center gap-4">
        {files.length > 0 && (
          <span>共 {files.length} 项</span>
        )}
        {selectedFiles.length > 0 && (
          <span className="text-blue-500">已选 {selectedFiles.length} 项</span>
        )}
        {previews.length > 0 && (
          <span className={conflictCount > 0 ? 'text-red-500' : 'text-green-500'}>
            预览 {previews.length} 项
            {conflictCount > 0 && ` (${conflictCount} 冲突)`}
          </span>
        )}
        {isExecuting && (
          <span className="text-orange-500">执行中...</span>
        )}
      </div>
    </div>
  )
}
