import { v4 as uuidv4 } from 'uuid'
import type { HistoryEntry, OperationResult } from '../../src/types'

interface RollbackInfo {
  type: 'rename' | 'delete' | 'copy' | 'move' | 'create'
  originalPath?: string
  newPath?: string
  backupPath?: string
}

export class HistoryService {
  private history: HistoryEntry[] = []
  private maxHistorySize = 100

  async recordOperation(
    operation: string,
    params: Record<string, unknown>,
    rollbackInfo?: RollbackInfo
  ): Promise<string> {
    const entry: HistoryEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      operation,
      params,
    }

    if (rollbackInfo) {
      entry.rollback = this.createRollbackFunction(rollbackInfo)
    }

    this.history.unshift(entry)

    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize)
    }

    return entry.id
  }

  private createRollbackFunction(rollbackInfo: RollbackInfo): () => Promise<void> {
    return async () => {
      const fs = await import('fs/promises')

      switch (rollbackInfo.type) {
        case 'rename':
          if (rollbackInfo.originalPath && rollbackInfo.newPath) {
            await fs.rename(rollbackInfo.newPath, rollbackInfo.originalPath)
          }
          break

        case 'delete':
          if (rollbackInfo.backupPath && rollbackInfo.originalPath) {
            await fs.rename(rollbackInfo.backupPath, rollbackInfo.originalPath)
          }
          break

        case 'move':
          if (rollbackInfo.originalPath && rollbackInfo.newPath) {
            await fs.rename(rollbackInfo.newPath, rollbackInfo.originalPath)
          }
          break

        case 'create':
          if (rollbackInfo.newPath) {
            const stats = await fs.stat(rollbackInfo.newPath)
            if (stats.isDirectory()) {
              await fs.rmdir(rollbackInfo.newPath)
            } else {
              await fs.unlink(rollbackInfo.newPath)
            }
          }
          break
      }
    }
  }

  async undo(): Promise<OperationResult> {
    const lastEntry = this.history[0]

    if (!lastEntry || !lastEntry.rollback) {
      return {
        success: false,
        error: '没有可撤销的操作',
      }
    }

    try {
      await lastEntry.rollback()
      this.history.shift()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      }
    }
  }

  getHistory(): HistoryEntry[] {
    return [...this.history]
  }

  clearHistory(): void {
    this.history = []
  }

  canUndo(): boolean {
    return this.history.length > 0 && this.history[0].rollback !== undefined
  }
}

export const historyService = new HistoryService()
