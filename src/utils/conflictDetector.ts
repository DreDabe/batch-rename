import type { FileItem } from '../types'
import { ILLEGAL_CHARS, RESERVED_NAMES } from '../types/rules'

export interface ConflictResult {
  hasConflict: boolean
  conflicts: ConflictInfo[]
}

export interface ConflictInfo {
  type: 'duplicate' | 'invalid' | 'exists'
  file: string
  message: string
}

export function detectConflicts(
  previews: { originalName: string; newName: string; originalPath: string; newPath: string }[]
): ConflictResult {
  const conflicts: ConflictInfo[] = []
  const nameMap = new Map<string, string[]>()

  for (const preview of previews) {
    const invalidConflict = checkInvalidName(preview.newName)
    if (invalidConflict) {
      conflicts.push({
        type: 'invalid',
        file: preview.originalName,
        message: invalidConflict,
      })
      continue
    }

    const normalizedName = preview.newName.toLowerCase()
    if (!nameMap.has(normalizedName)) {
      nameMap.set(normalizedName, [])
    }
    nameMap.get(normalizedName)!.push(preview.originalName)
  }

  for (const files of nameMap.values()) {
    if (files.length > 1) {
      for (const file of files) {
        conflicts.push({
          type: 'duplicate',
          file,
          message: `文件名冲突: ${files.join(', ')}`,
        })
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  }
}

export function checkInvalidName(name: string): string | null {
  if (!name || name.trim() === '') {
    return '文件名不能为空'
  }

  if (name.length > 255) {
    return '文件名长度超过255个字符'
  }

  const illegalMatch = name.match(ILLEGAL_CHARS)
  if (illegalMatch) {
    return `文件名包含非法字符: ${illegalMatch.join(', ')}`
  }

  if (name.endsWith('.') || name.endsWith(' ')) {
    return '文件名不能以点号或空格结尾'
  }

  const nameWithoutExt = name.split('.')[0].toUpperCase()
  if (RESERVED_NAMES.includes(nameWithoutExt)) {
    return `文件名不能使用系统保留名称: ${nameWithoutExt}`
  }

  return null
}

export function checkFileExists(
  newPath: string,
  existingFiles: FileItem[]
): boolean {
  return existingFiles.some(
    (file) => file.path.toLowerCase() === newPath.toLowerCase()
  )
}

export function validatePattern(pattern: string): { valid: boolean; error?: string } {
  if (!pattern || pattern.trim() === '') {
    return { valid: false, error: '规则不能为空' }
  }

  const expressionRegex = /\{\$([a-zA-Z]+)(?:%([^}]+))?\}/g
  const validTypes = ['n', 'l', 'L', 'f', 'ext', 'd', 't']

  let match
  while ((match = expressionRegex.exec(pattern)) !== null) {
    const type = match[1]
    if (!validTypes.includes(type)) {
      return { valid: false, error: `未知的表达式类型: ${type}` }
    }
  }

  return { valid: true }
}

export function getConflictSummary(conflicts: ConflictInfo[]): string {
  if (conflicts.length === 0) {
    return ''
  }

  const grouped = {
    duplicate: 0,
    invalid: 0,
    exists: 0,
  }

  for (const conflict of conflicts) {
    grouped[conflict.type]++
  }

  const parts: string[] = []
  if (grouped.duplicate > 0) {
    parts.push(`${grouped.duplicate} 个文件名冲突`)
  }
  if (grouped.invalid > 0) {
    parts.push(`${grouped.invalid} 个非法文件名`)
  }
  if (grouped.exists > 0) {
    parts.push(`${grouped.exists} 个文件已存在`)
  }

  return parts.join('，')
}
