/// <reference types="vite/client" />

import type { OperationResult, DirectoryInfo, AppConfig, HistoryEntry } from './types'

interface FileSystemAPI {
  readDirectory: (dirPath: string) => Promise<OperationResult<DirectoryInfo>>
  rename: (oldPath: string, newPath: string) => Promise<OperationResult>
  delete: (pathToDelete: string, recursive?: boolean) => Promise<OperationResult>
  createFolder: (parentPath: string, name: string) => Promise<OperationResult<string>>
  copy: (source: string, destination: string) => Promise<OperationResult>
  move: (source: string, destination: string) => Promise<OperationResult>
  exists: (targetPath: string) => Promise<boolean>
}

interface DialogAPI {
  openDirectory: () => Promise<string | null>
  showMessage: (options: {
    type: 'none' | 'info' | 'error' | 'question' | 'warning'
    title: string
    message: string
    buttons?: string[]
  }) => Promise<{ response: number; checkboxChecked: boolean }>
}

interface HistoryAPI {
  undo: () => Promise<OperationResult>
  getHistory: () => Promise<HistoryEntry[]>
  canUndo: () => Promise<boolean>
  clear: () => Promise<OperationResult>
}

interface ConfigAPI {
  load: () => Promise<OperationResult<AppConfig>>
  get: () => Promise<AppConfig>
  update: (key: string, value: unknown) => Promise<OperationResult>
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

interface ElectronAPI {
  fs: FileSystemAPI
  dialog: DialogAPI
  history: HistoryAPI
  config: ConfigAPI
  version: VersionAPI
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
