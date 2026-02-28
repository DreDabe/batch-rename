export interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  isFile: boolean
  size: number
  createdAt: Date
  modifiedAt: Date
  extension: string
}

export interface DirectoryInfo {
  path: string
  files: FileItem[]
  totalCount: number
}

export interface RenameOptions {
  oldPath: string
  newPath: string
}

export interface DeleteOptions {
  path: string
  recursive?: boolean
}

export interface CreateFolderOptions {
  parentPath: string
  name: string
}

export interface CopyOptions {
  source: string
  destination: string
}

export interface MoveOptions {
  source: string
  destination: string
}

export interface OperationResult {
  success: boolean
  error?: string
  data?: unknown
}

export interface HistoryEntry {
  id: string
  timestamp: Date
  operation: string
  params: Record<string, unknown>
  rollback?: () => Promise<void>
}

export interface AppConfig {
  theme: 'light' | 'dark' | 'system'
  language: 'zh-CN' | 'en-US'
  lastOpenedPath?: string
  favorites: string[]
  recentPaths: string[]
}

export const DEFAULT_CONFIG: AppConfig = {
  theme: 'system',
  language: 'zh-CN',
  favorites: [],
  recentPaths: [],
}
