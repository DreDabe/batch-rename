import { useState, useCallback, useEffect } from 'react'
import { logger, type ActionLogEntry, type LogLevel, type ActionType } from '../utils/logger'
import { useActionLogger } from '../hooks/useActionLogger'
import { useSettingsStore } from '../stores/settingsStore'

const LEVEL_COLORS: Record<LogLevel, { light: string; dark: string }> = {
  debug: { light: 'text-gray-500 bg-gray-100', dark: 'text-gray-400 bg-gray-800' },
  info: { light: 'text-blue-600 bg-blue-100', dark: 'text-blue-400 bg-blue-900/20' },
  warn: { light: 'text-yellow-600 bg-yellow-100', dark: 'text-yellow-400 bg-yellow-900/20' },
  error: { light: 'text-red-600 bg-red-100', dark: 'text-red-400 bg-red-900/20' },
}

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  click: '👆 点击',
  input: '⌨️ 输入',
  select: '📋 选择',
  submit: '📤 提交',
  navigate: '🔄 导航',
  load: '📥 加载',
  save: '💾 保存',
  delete: '🗑️ 删除',
  create: '➕ 创建',
  update: '✏️ 更新',
  execute: '⚡ 执行',
  undo: '↩️ 撤销',
  redo: '↪️ 重做',
  shortcut: '⌨️ 快捷键',
  error: '❌ 错误',
  state_change: '📊 状态变更',
  preview: '👁️ 预览',
}

interface LogViewerProps {
  onClose: () => void
}

export function LogViewer({ onClose }: LogViewerProps) {
  const [logs, setLogs] = useState<ActionLogEntry[]>([])
  const [filter, setFilter] = useState<{
    level?: LogLevel
    actionType?: ActionType
    module?: string
    search?: string
  }>({})
  const [autoRefresh, setAutoRefresh] = useState(true)

  const { logClick, logSelect, logAction } = useActionLogger({
    module: 'LogViewer',
    componentName: 'LogViewer',
  })
  
  const { settings } = useSettingsStore()
  const { theme } = settings

  const loadLogs = useCallback(() => {
    const actionLogs = logger.getActionLogs(filter)
    setLogs(actionLogs)
  }, [filter])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, loadLogs])

  const handleExport = useCallback(() => {
    logClick('导出日志按钮')
    const exportedLogs = logger.exportLogs()
    const blob = new Blob([exportedLogs], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batch-rename-logs-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    logAction({
      actionType: 'save',
      message: '导出日志文件',
    })
  }, [logClick, logAction])

  const handleClear = useCallback(() => {
    logClick('清空日志按钮')
    if (confirm('确定要清空所有日志吗？')) {
      logger.clearAllLogs()
      loadLogs()
      logAction({
        actionType: 'delete',
        message: '清空所有日志',
      })
    }
  }, [loadLogs, logClick, logAction])

  const handleLevelFilter = useCallback((level: LogLevel | undefined) => {
    logSelect('日志级别过滤', level || '全部')
    setFilter((prev) => ({ ...prev, level }))
  }, [logSelect])

  const handleActionTypeFilter = useCallback((actionType: ActionType | undefined) => {
    logSelect('操作类型过滤', actionType || '全部')
    setFilter((prev) => ({ ...prev, actionType }))
  }, [logSelect])

  const handleSearch = useCallback((search: string) => {
    setFilter((prev) => ({ ...prev, search: search || undefined }))
  }, [])

  const filteredLogs = filter.search
    ? logs.filter(
        (log) =>
          log.message.toLowerCase().includes(filter.search!.toLowerCase()) ||
          log.module.toLowerCase().includes(filter.search!.toLowerCase()) ||
          log.componentName?.toLowerCase().includes(filter.search!.toLowerCase())
      )
    : logs

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`rounded-lg shadow-xl w-[900px] h-[600px] flex flex-col ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
        <div className={`flex items-center justify-between px-4 py-3 border-b ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>操作日志查看器</h3>
          <button onClick={onClose} className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
            ✕
          </button>
        </div>

        <div className={`flex items-center gap-3 px-4 py-2 border-b ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-1">
            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>级别:</span>
            <select
              value={filter.level || ''}
              onChange={(e) => handleLevelFilter(e.target.value as LogLevel || undefined)}
              className={`text-sm border rounded px-2 py-1 ${theme === 'dark' ? 'bg-gray-600 border-gray-500 text-gray-300' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="">全部</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>类型:</span>
            <select
              value={filter.actionType || ''}
              onChange={(e) => handleActionTypeFilter(e.target.value as ActionType || undefined)}
              className={`text-sm border rounded px-2 py-1 ${theme === 'dark' ? 'bg-gray-600 border-gray-500 text-gray-300' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="">全部</option>
              {Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="搜索..."
            value={filter.search || ''}
            onChange={(e) => handleSearch(e.target.value)}
            className={`flex-1 px-3 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-600 border-gray-500 text-gray-300' : 'bg-white border-gray-300 text-gray-900'}`}
          />

          <label className={`flex items-center gap-1 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className={`rounded ${theme === 'dark' ? 'border-gray-500' : 'border-gray-300'}`}
            />
            <span>自动刷新</span>
          </label>

          <button
            onClick={loadLogs}
            className={`px-3 py-1 text-sm rounded ${theme === 'dark' ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            刷新
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className={`sticky top-0 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-3 py-2 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} w-44`}>时间</th>
                <th className={`px-3 py-2 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} w-16`}>级别</th>
                <th className={`px-3 py-2 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} w-28`}>类型</th>
                <th className={`px-3 py-2 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} w-28`}>模块</th>
                <th className={`px-3 py-2 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>消息</th>
              </tr>
            </thead>
            <tbody className={theme === 'dark' ? 'divide-y divide-gray-700' : 'divide-y divide-gray-100'}>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-3 py-8 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    暂无日志记录
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={`${log.timestampMs}-${index}`} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className={`px-3 py-2 text-xs font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {log.timestamp}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${LEVEL_COLORS[log.level][theme]}`}>
                        {log.level.toUpperCase()}
                      </span>
                    </td>
                    <td className={`px-3 py-2 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {ACTION_TYPE_LABELS[log.actionType] || log.actionType}
                    </td>
                    <td className={`px-3 py-2 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {log.componentName ? `${log.module}/${log.componentName}` : log.module}
                    </td>
                    <td className={`px-3 py-2 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
                      <div className="truncate max-w-md" title={log.message}>
                        {log.message}
                      </div>
                      {log.data !== undefined && log.data !== null && (
                        <div className={`mt-1 text-xs font-mono truncate max-w-md ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} title={JSON.stringify(log.data)}>
                          {JSON.stringify(log.data).substring(0, 100)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={`flex items-center justify-between px-4 py-3 border-t ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            共 {filteredLogs.length} 条日志
            {filter.search && ` (搜索: "${filter.search}")`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className={`px-3 py-1.5 text-sm rounded ${theme === 'dark' ? 'text-red-400 border border-red-700 hover:bg-red-900/20' : 'text-red-500 border border-red-300 hover:bg-red-50'}`}
            >
              清空日志
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              导出日志
            </button>
            <button
              onClick={onClose}
              className={`px-3 py-1.5 text-sm rounded ${theme === 'dark' ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LogViewerButton() {
  const [showViewer, setShowViewer] = useState(false)
  const { logClick } = useActionLogger({
    module: 'LogViewer',
    componentName: 'LogViewerButton',
  })
  const { settings } = useSettingsStore()
  const { theme } = settings

  const handleClick = useCallback(() => {
    logClick('打开日志查看器按钮')
    setShowViewer(true)
  }, [logClick])

  const handleClose = useCallback(() => {
    setShowViewer(false)
  }, [])

  return (
    <>
      <button
        onClick={handleClick}
        className={`px-2 py-1 text-xs rounded ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
        title="查看操作日志"
      >
        📋 日志
      </button>
      {showViewer && <LogViewer onClose={handleClose} />}
    </>
  )
}
