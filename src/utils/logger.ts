export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type ActionType =
  | 'click'
  | 'input'
  | 'select'
  | 'submit'
  | 'navigate'
  | 'load'
  | 'save'
  | 'delete'
  | 'create'
  | 'update'
  | 'execute'
  | 'undo'
  | 'redo'
  | 'shortcut'
  | 'error'
  | 'state_change'
  | 'preview'

export interface ActionLogEntry {
  timestamp: string
  timestampMs: number
  level: LogLevel
  module: string
  componentId?: string
  componentName?: string
  actionType: ActionType
  message: string
  previousState?: unknown
  newState?: unknown
  data?: unknown
  userPath?: string[]
  duration?: number
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  data?: unknown
}

const LOG_STORAGE_KEY = 'batch-rename-logs'
const ACTION_LOG_STORAGE_KEY = 'batch-rename-action-logs'
const MAX_LOG_ENTRIES = 500
const MAX_ACTION_LOG_ENTRIES = 300

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'apiKey', 'api_key', 'credential', 'auth']

function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === 'string') {
    return data
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item))
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase()
      if (SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk))) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = sanitizeData(value)
      }
    }
    return sanitized
  }

  return data
}

const ConsoleStyles = {
  debug: 'color: #6B7280; font-weight: normal',
  info: 'color: #2563EB; font-weight: normal',
  warn: 'color: #D97706; font-weight: bold',
  error: 'color: #DC2626; font-weight: bold',
  module: 'color: #7C3AED; font-weight: bold',
  action: 'color: #059669; font-weight: bold',
  timestamp: 'color: #9CA3AF',
  component: 'color: #0891B2',
}

const ActionTypeLabels: Record<ActionType, string> = {
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

class Logger {
  private logs: LogEntry[] = []
  private actionLogs: ActionLogEntry[] = []
  private enabled: boolean = true
  private actionLoggingEnabled: boolean = true
  private userPath: string[] = []
  private sessionStartTime: number

  constructor() {
    this.sessionStartTime = Date.now()
    this.loadLogs()
  }

  private loadLogs(): void {
    try {
      const stored = localStorage.getItem(LOG_STORAGE_KEY)
      if (stored) {
        this.logs = JSON.parse(stored)
      }
      const actionStored = localStorage.getItem(ACTION_LOG_STORAGE_KEY)
      if (actionStored) {
        this.actionLogs = JSON.parse(actionStored)
      }
    } catch {
      this.logs = []
      this.actionLogs = []
    }
  }

  private saveLogs(): void {
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs))
    } catch {
      this.logs = this.logs.slice(-100)
      try {
        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs))
      } catch {
        // Ignore
      }
    }
  }

  private saveActionLogs(): void {
    try {
      localStorage.setItem(ACTION_LOG_STORAGE_KEY, JSON.stringify(this.actionLogs))
    } catch {
      this.actionLogs = this.actionLogs.slice(-50)
      try {
        localStorage.setItem(ACTION_LOG_STORAGE_KEY, JSON.stringify(this.actionLogs))
      } catch {
        // Ignore
      }
    }
  }

  private getTimestamp(): { iso: string; ms: number } {
    const now = Date.now()
    return {
      iso: new Date(now).toISOString(),
      ms: now,
    }
  }

  private addLog(level: LogLevel, module: string, message: string, data?: unknown): void {
    if (!this.enabled) return

    const { iso: timestamp } = this.getTimestamp()
    const sanitizedData = sanitizeData(data)

    const entry: LogEntry = {
      timestamp,
      level,
      module,
      message,
      data: sanitizedData,
    }

    this.logs.push(entry)

    if (this.logs.length > MAX_LOG_ENTRIES) {
      this.logs = this.logs.slice(-MAX_LOG_ENTRIES)
    }

    this.saveLogs()

    if (import.meta.env.DEV) {
      this.consoleLog(level, module, message, sanitizedData)
    }
  }

  private consoleLog(level: LogLevel, module: string, message: string, data?: unknown): void {
    const { iso: timestamp } = this.getTimestamp()
    const prefix = `%c[${timestamp}]%c %c[${level.toUpperCase()}]%c %c[${module}]%c`

    const styles = [
      ConsoleStyles.timestamp,
      '',
      ConsoleStyles[level],
      '',
      ConsoleStyles.module,
      '',
    ]

    const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log

    if (data !== undefined) {
      logMethod(prefix, ...styles, message, data)
    } else {
      logMethod(prefix, ...styles, message)
    }
  }

  private consoleActionLog(entry: ActionLogEntry): void {
    const actionLabel = ActionTypeLabels[entry.actionType] || entry.actionType
    const prefix = `%c[${entry.timestamp}]%c %c${actionLabel}%c %c[${entry.module}]%c`

    const styles = [
      ConsoleStyles.timestamp,
      '',
      ConsoleStyles.action,
      '',
      ConsoleStyles.module,
      '',
    ]

    let message = entry.message
    if (entry.componentName) {
      message = `%c[${entry.componentName}]%c ${message}`
      styles.push(ConsoleStyles.component, '')
    }

    const logMethod = entry.level === 'error' ? console.error : console.log

    const logData: Record<string, unknown> = {}
    if (entry.previousState !== undefined) {
      logData.previousState = entry.previousState
    }
    if (entry.newState !== undefined) {
      logData.newState = entry.newState
    }
    if (entry.data !== undefined) {
      logData.data = entry.data
    }
    if (entry.duration !== undefined) {
      logData.duration = `${entry.duration}ms`
    }

    if (Object.keys(logData).length > 0) {
      logMethod(prefix, ...styles, message, logData)
    } else {
      logMethod(prefix, ...styles, message)
    }
  }

  logAction(params: {
    module: string
    componentId?: string
    componentName?: string
    actionType: ActionType
    message: string
    previousState?: unknown
    newState?: unknown
    data?: unknown
    level?: LogLevel
  }): void {
    if (!this.enabled || !this.actionLoggingEnabled) return

    const { iso: timestamp, ms: timestampMs } = this.getTimestamp()
    const sanitizedPrevious = sanitizeData(params.previousState)
    const sanitizedNew = sanitizeData(params.newState)
    const sanitizedData = sanitizeData(params.data)

    const entry: ActionLogEntry = {
      timestamp,
      timestampMs,
      level: params.level || 'info',
      module: params.module,
      componentId: params.componentId,
      componentName: params.componentName,
      actionType: params.actionType,
      message: params.message,
      previousState: sanitizedPrevious,
      newState: sanitizedNew,
      data: sanitizedData,
      userPath: [...this.userPath],
    }

    this.actionLogs.push(entry)

    if (this.actionLogs.length > MAX_ACTION_LOG_ENTRIES) {
      this.actionLogs = this.actionLogs.slice(-MAX_ACTION_LOG_ENTRIES)
    }

    this.saveActionLogs()

    this.userPath.push(`${params.module}:${params.actionType}`)

    if (import.meta.env.DEV) {
      this.consoleActionLog(entry)
    }
  }

  logUserInteraction(params: {
    module: string
    componentId: string
    componentName: string
    actionType: 'click' | 'input' | 'select' | 'submit'
    message: string
    data?: unknown
  }): void {
    this.logAction({
      ...params,
      level: 'info',
    })
  }

  logStateChange(params: {
    module: string
    message: string
    previousState?: unknown
    newState?: unknown
  }): void {
    this.logAction({
      ...params,
      actionType: 'state_change',
      level: 'debug',
    })
  }

  logError(params: {
    module: string
    componentName?: string
    message: string
    error?: Error | unknown
    data?: unknown
  }): void {
    const errorData = params.error instanceof Error
      ? { name: params.error.name, message: params.error.message, stack: params.error.stack }
      : params.error

    const dataObj = typeof params.data === 'object' && params.data !== null ? params.data : {}

    this.logAction({
      module: params.module,
      componentName: params.componentName,
      actionType: 'error',
      message: params.message,
      level: 'error',
      data: { ...dataObj, error: errorData },
    })

    this.addLog('error', params.module, params.message, { error: errorData, ...dataObj })
  }

  startTimer(): () => number {
    const start = performance.now()
    return () => Math.round(performance.now() - start)
  }

  debug(module: string, message: string, data?: unknown): void {
    this.addLog('debug', module, message, data)
  }

  info(module: string, message: string, data?: unknown): void {
    this.addLog('info', module, message, data)
  }

  warn(module: string, message: string, data?: unknown): void {
    this.addLog('warn', module, message, data)
  }

  error(module: string, message: string, data?: unknown): void {
    this.addLog('error', module, message, data)
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level)
    }
    return [...this.logs]
  }

  getActionLogs(filter?: {
    level?: LogLevel
    actionType?: ActionType
    module?: string
    componentName?: string
    since?: number
  }): ActionLogEntry[] {
    let result = [...this.actionLogs]

    if (filter) {
      if (filter.level) {
        result = result.filter((log) => log.level === filter.level)
      }
      if (filter.actionType) {
        result = result.filter((log) => log.actionType === filter.actionType)
      }
      if (filter.module) {
        result = result.filter((log) => log.module === filter.module)
      }
      if (filter.componentName) {
        result = result.filter((log) => log.componentName === filter.componentName)
      }
      if (filter.since !== undefined) {
        result = result.filter((log) => log.timestampMs >= filter.since!)
      }
    }

    return result
  }

  getRecentLogs(count = 50): LogEntry[] {
    return this.logs.slice(-count)
  }

  getRecentActionLogs(count = 50): ActionLogEntry[] {
    return this.actionLogs.slice(-count)
  }

  clearLogs(): void {
    this.logs = []
    this.saveLogs()
  }

  clearActionLogs(): void {
    this.actionLogs = []
    this.userPath = []
    this.saveActionLogs()
  }

  clearAllLogs(): void {
    this.clearLogs()
    this.clearActionLogs()
  }

  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
  }

  enableActionLogging(): void {
    this.actionLoggingEnabled = true
  }

  disableActionLogging(): void {
    this.actionLoggingEnabled = false
  }

  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime
  }

  getUserPath(): string[] {
    return [...this.userPath]
  }

  exportLogs(): string {
    return JSON.stringify({
      sessionStartTime: this.sessionStartTime,
      sessionDuration: this.getSessionDuration(),
      userPath: this.userPath,
      logs: this.logs,
      actionLogs: this.actionLogs,
    }, null, 2)
  }
}

export const logger = new Logger()

export function createModuleLogger(module: string) {
  return {
    debug: (message: string, data?: unknown) => logger.debug(module, message, data),
    info: (message: string, data?: unknown) => logger.info(module, message, data),
    warn: (message: string, data?: unknown) => logger.warn(module, message, data),
    error: (message: string, data?: unknown) => logger.error(module, message, data),
    logAction: (params: Omit<Parameters<typeof logger.logAction>[0], 'module'>) =>
      logger.logAction({ ...params, module }),
    logUserInteraction: (params: Omit<Parameters<typeof logger.logUserInteraction>[0], 'module'>) =>
      logger.logUserInteraction({ ...params, module }),
    logStateChange: (params: Omit<Parameters<typeof logger.logStateChange>[0], 'module'>) =>
      logger.logStateChange({ ...params, module }),
    logError: (params: Omit<Parameters<typeof logger.logError>[0], 'module'>) =>
      logger.logError({ ...params, module }),
    startTimer: () => logger.startTimer(),
  }
}
