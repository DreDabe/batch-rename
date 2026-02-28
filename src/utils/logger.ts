export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  data?: unknown
}

const LOG_STORAGE_KEY = 'batch-rename-logs'
const MAX_LOG_ENTRIES = 500

class Logger {
  private logs: LogEntry[] = []
  private enabled: boolean = true

  constructor() {
    this.loadLogs()
  }

  private loadLogs(): void {
    try {
      const stored = localStorage.getItem(LOG_STORAGE_KEY)
      if (stored) {
        this.logs = JSON.parse(stored)
      }
    } catch {
      this.logs = []
    }
  }

  private saveLogs(): void {
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs))
    } catch {
      // Storage full, clear old logs
      this.logs = this.logs.slice(-100)
      try {
        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs))
      } catch {
        // Ignore
      }
    }
  }

  private addLog(level: LogLevel, module: string, message: string, data?: unknown): void {
    if (!this.enabled) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
    }

    this.logs.push(entry)

    if (this.logs.length > MAX_LOG_ENTRIES) {
      this.logs = this.logs.slice(-MAX_LOG_ENTRIES)
    }

    this.saveLogs()

    if (process.env.NODE_ENV === 'development') {
      const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${module}]`
      switch (level) {
        case 'error':
          console.error(prefix, message, data || '')
          break
        case 'warn':
          console.warn(prefix, message, data || '')
          break
        case 'debug':
          console.debug(prefix, message, data || '')
          break
        default:
          console.log(prefix, message, data || '')
      }
    }
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

  getRecentLogs(count = 50): LogEntry[] {
    return this.logs.slice(-count)
  }

  clearLogs(): void {
    this.logs = []
    this.saveLogs()
  }

  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
  }
}

export const logger = new Logger()

export function createModuleLogger(module: string) {
  return {
    debug: (message: string, data?: unknown) => logger.debug(module, message, data),
    info: (message: string, data?: unknown) => logger.info(module, message, data),
    warn: (message: string, data?: unknown) => logger.warn(module, message, data),
    error: (message: string, data?: unknown) => logger.error(module, message, data),
  }
}
