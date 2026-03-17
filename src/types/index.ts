export interface DriveInfo {
  name: string
  path: string
  type: 'fixed' | 'removable' | 'network' | 'cdrom' | 'unknown'
  size?: number
  freeSpace?: number
}

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

export type NumberType = 'none' | 'number' | 'lowerLetter' | 'upperLetter'

export type TagPosition = 'left' | 'right'

export interface AppConfig {
  theme: 'light' | 'dark'
  language: 'zh-CN' | 'en-US'
  lastOpenedPath?: string
  favorites: string[]
  recentPaths: string[]
  openLastPath: boolean
  showSuccessAlert: boolean
  allowOverwrite: boolean
  numberType: NumberType
  customExtensions: string[]
  customRule: string
  tagPosition: TagPosition
  darkMode?: boolean
  autoRefreshAfterRename?: boolean
}

export const DEFAULT_CONFIG: AppConfig = {
  theme: 'light',
  language: 'zh-CN',
  lastOpenedPath: '',
  favorites: [],
  recentPaths: [],
  openLastPath: false,
  showSuccessAlert: true,
  allowOverwrite: false,
  numberType: 'none',
  customExtensions: [],
  customRule: '{$f}',
  tagPosition: 'right',
}

export * from './rules'
