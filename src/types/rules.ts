export type ExpressionType = 'number' | 'lowerLetter' | 'upperLetter' | 'filename' | 'extension' | 'date' | 'time' | 'custom'

export interface Expression {
  type: ExpressionType
  raw: string
  format?: string
  start?: number
  step?: number
}

export interface ReplaceRule {
  search: string
  replace: string
  isRegex: boolean
  caseSensitive: boolean
}

export interface RenameRule {
  pattern: string
  expressions: Expression[]
  replaces: ReplaceRule[]
  tags: string[]
}

export interface RenamePreview {
  originalName: string
  newName: string
  originalPath: string
  newPath: string
  hasConflict: boolean
  conflictType?: 'duplicate' | 'invalid' | 'exists'
}

export interface ConflictInfo {
  type: 'duplicate' | 'invalid' | 'exists'
  files: string[]
  message: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

// eslint-disable-next-line no-control-regex
export const ILLEGAL_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g

export const RESERVED_NAMES = [
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
]
