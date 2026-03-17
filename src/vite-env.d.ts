/// <reference types="vite/client" />

import type { OperationResult, DirectoryInfo, AppConfig, HistoryEntry } from './types'

interface FileSystemAPI {
  readDirectory: (dirPath: string) => Promise<OperationResult<DirectoryInfo>>
  rename: (oldPath: string, newPath: string) => Promise<OperationResult>
  delete: (pathToDelete: string, recursive?: boolean) => Promise<OperationResult>
  createFolder: (parentPath: string, name: string) => Promise<OperationResult<string>>
  createFile: (parentPath: string, name: string, content: string) => Promise<OperationResult<string>>
  copy: (source: string, destination: string) => Promise<OperationResult>
  move: (source: string, destination: string) => Promise<OperationResult>
  exists: (targetPath: string) => Promise<boolean>
  readFile: (targetPath: string, maxSize?: number) => Promise<OperationResult<string>>
  readImageBase64: (targetPath: string) => Promise<OperationResult<string>>
  getDrives: () => Promise<OperationResult<DriveInfo[]>>
  hasChildren: (dirPath: string) => Promise<boolean>
}

interface DriveInfo {
  name: string
  path: string
  type: 'fixed' | 'removable' | 'network' | 'cdrom' | 'unknown'
  size?: number
  freeSpace?: number
}

interface DialogAPI {
  openDirectory: () => Promise<string | null>
  showMessage: (options: {
    type: 'none' | 'info' | 'error' | 'question' | 'warning'
    title: string
    message: string
    buttons?: string[]
  }) => Promise<{ response: number; checkboxChecked: boolean }>
  saveFile: (options: any) => Promise<{ canceled: boolean; filePath: string | null }>
}

interface MenuAPI {
  onNewFile: (callback: () => void) => void
  onNewFolder: (callback: () => void) => void
  onOpenFile: (callback: (event: any, path: string) => void) => void
  onOpenDirectory: (callback: (event: any, path: string) => void) => void
  onSave: (callback: () => void) => void
  onSaveAs: (callback: () => void) => void
  onUndo: (callback: () => void) => void
  onAbout: (callback: () => void) => void
}

interface HistoryAPI {
  undo: () => Promise<OperationResult>
  getHistory: () => Promise<HistoryEntry[]>
  canUndo: () => Promise<boolean>
  clear: () => Promise<OperationResult>
  recordOperation: (operation: string, params: Record<string, unknown>, rollbackInfo?: any) => Promise<string>
}

interface ConfigAPI {
  load: () => Promise<OperationResult<AppConfig>>
  get: () => Promise<AppConfig>
  update: (key: string, value: unknown) => Promise<OperationResult>
  setConfig: (config: Partial<AppConfig>) => Promise<OperationResult>
  addFavorite: (path: string) => Promise<OperationResult>
  removeFavorite: (path: string) => Promise<OperationResult>
}

interface VersionAPI {
  checkUpdate: () => Promise<
    OperationResult<{
      currentVersion: string
      latestVersion: string
      hasUpdate: boolean
      downloadUrl?: string
      releaseNotes?: string
      publishedAt?: string
    }>
  >
  current: () => Promise<string>
}

interface DebugAPI {
  log: (message: string, data?: unknown) => void
}

interface ElectronAPI {
  fs: FileSystemAPI
  dialog: DialogAPI
  history: HistoryAPI
  config: ConfigAPI
  version: VersionAPI
  debug: DebugAPI
  menu: MenuAPI
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
