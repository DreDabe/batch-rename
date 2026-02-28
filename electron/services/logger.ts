import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: unknown
}

export class LogService {
  private logDir: string
  private currentLogFile: string
  private maxLogSize = 5 * 1024 * 1024
  private maxLogFiles = 5

  constructor() {
    this.logDir = path.join(app.getPath('userData'), 'logs')
    this.currentLogFile = this.getLogFileName()
  }

  private getLogFileName(): string {
    const date = new Date().toISOString().split('T')[0]
    return path.join(this.logDir, `app-${date}.log`)
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.logDir, { recursive: true })
    await this.rotateLogs()
  }

  async log(level: LogLevel, message: string, data?: unknown): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    }

    const logLine = JSON.stringify(entry) + '\n'

    try {
      await this.checkLogRotation()
      await fs.appendFile(this.currentLogFile, logLine, 'utf-8')
    } catch {
      // Silently fail if logging fails
    }

    if (process.env.NODE_ENV === 'development') {
      this.consoleLog(entry)
    }
  }

  private consoleLog(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`
    const message = entry.data ? `${entry.message}` : entry.message

    switch (entry.level) {
      case 'error':
        console.error(prefix, message, entry.data || '')
        break
      case 'warn':
        console.warn(prefix, message, entry.data || '')
        break
      case 'debug':
        console.debug(prefix, message, entry.data || '')
        break
      default:
        console.log(prefix, message, entry.data || '')
    }
  }

  private async checkLogRotation(): Promise<void> {
    try {
      const stats = await fs.stat(this.currentLogFile)
      if (stats.size >= this.maxLogSize) {
        await this.rotateLogs()
      }
    } catch {
      // File doesn't exist, no rotation needed
    }
  }

  private async rotateLogs(): Promise<void> {
    const files = await this.getLogFiles()

    if (files.length >= this.maxLogFiles) {
      const filesToDelete = files.slice(this.maxLogFiles - 1)
      for (const file of filesToDelete) {
        await fs.unlink(path.join(this.logDir, file))
      }
    }
  }

  private async getLogFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.logDir)
      return files.filter((f) => f.startsWith('app-') && f.endsWith('.log')).sort().reverse()
    } catch {
      return []
    }
  }

  async getLogs(): Promise<string[]> {
    try {
      const content = await fs.readFile(this.currentLogFile, 'utf-8')
      return content.trim().split('\n')
    } catch {
      return []
    }
  }

  debug(message: string, data?: unknown): Promise<void> {
    return this.log('debug', message, data)
  }

  info(message: string, data?: unknown): Promise<void> {
    return this.log('info', message, data)
  }

  warn(message: string, data?: unknown): Promise<void> {
    return this.log('warn', message, data)
  }

  error(message: string, data?: unknown): Promise<void> {
    return this.log('error', message, data)
  }
}

export const logService = new LogService()
