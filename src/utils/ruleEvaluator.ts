import type { FileItem } from '../types'
import type { Expression, ReplaceRule } from '../types/rules'
import { parsePattern, parseReplaces } from './ruleParser'

const LOWER_LETTERS = 'abcdefghijklmnopqrstuvwxyz'
const UPPER_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function applyRule(
  file: FileItem,
  pattern: string,
  index: number
): string {
  let result = pattern

  const expressions = parsePattern(pattern)
  const replaces = parseReplaces(pattern)

  for (const expr of expressions) {
    const value = evaluateExpression(expr, file, index)
    result = result.replace(expr.raw, value)
  }

  for (const replace of replaces) {
    result = applyReplace(result, {
      search: replace.search,
      replace: replace.replace,
      isRegex: false,
      caseSensitive: false,
    })
  }

  return result
}

function evaluateExpression(
  expr: Expression,
  file: FileItem,
  index: number
): string {
  switch (expr.type) {
    case 'number':
      return formatNumber(index, expr)

    case 'lowerLetter':
      return formatLetter(index, expr, false)

    case 'upperLetter':
      return formatLetter(index, expr, true)

    case 'filename':
      return getFileNameWithoutExtension(file.name)

    case 'extension':
      return file.extension ? '.' + file.extension : ''

    case 'date':
      return formatDate(new Date(), expr.format)

    case 'time':
      return formatTime(new Date(), expr.format)

    default:
      return expr.raw
  }
}

function formatNumber(index: number, expr: Expression): string {
  const start = expr.start ?? 1
  const step = expr.step ?? 1
  const num = start + index * step

  const digits = parseDigits(expr.format)
  return num.toString().padStart(digits, '0')
}

function parseDigits(format?: string): number {
  if (!format) return 1

  const zeroMatch = format.match(/^(0+)$/)
  if (zeroMatch) {
    return zeroMatch[1].length
  }

  const numMatch = format.match(/^(\d+)$/)
  if (numMatch) {
    return parseInt(numMatch[1], 10)
  }

  return 1
}

function formatLetter(index: number, expr: Expression, uppercase: boolean): string {
  const start = expr.start ?? 1
  const step = expr.step ?? 1
  const num = start + index * step - 1

  const letters = uppercase ? UPPER_LETTERS : LOWER_LETTERS
  const base = letters.length

  if (num < 0) return letters[0]

  let result = ''
  let n = num
  do {
    result = letters[n % base] + result
    n = Math.floor(n / base)
  } while (n > 0)

  return result
}

function getFileNameWithoutExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return filename
  }
  return filename.substring(0, lastDotIndex)
}

function formatDate(date: Date, format?: string): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')

  if (format === 'yyyy-mm-dd' || !format) {
    return `${year}-${month}-${day}`
  }

  if (format === 'yyyymmdd') {
    return `${year}${month}${day}`
  }

  if (format === 'mm-dd') {
    return `${month}-${day}`
  }

  return `${year}-${month}-${day}`
}

function formatTime(date: Date, format?: string): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')

  if (format === 'hh:mm:ss' || !format) {
    return `${hours}:${minutes}:${seconds}`
  }

  if (format === 'hhmmss') {
    return `${hours}${minutes}${seconds}`
  }

  if (format === 'hh:mm') {
    return `${hours}:${minutes}`
  }

  return `${hours}:${minutes}:${seconds}`
}

function applyReplace(text: string, rule: ReplaceRule): string {
  if (rule.isRegex) {
    try {
      const flags = rule.caseSensitive ? 'g' : 'gi'
      const regex = new RegExp(rule.search, flags)
      return text.replace(regex, rule.replace)
    } catch {
      return text
    }
  }

  if (rule.caseSensitive) {
    return text.split(rule.search).join(rule.replace)
  }

  const lowerText = text.toLowerCase()
  const lowerSearch = rule.search.toLowerCase()
  let result = ''
  let i = 0
  let lastIdx = 0

  while ((i = lowerText.indexOf(lowerSearch, lastIdx)) !== -1) {
    result += text.substring(lastIdx, i) + rule.replace
    lastIdx = i + rule.search.length
  }

  result += text.substring(lastIdx)
  return result
}

export function generatePreview(
  files: FileItem[],
  pattern: string
): { originalName: string; newName: string; originalPath: string; newPath: string }[] {
  return files.map((file, index) => {
    const newName = applyRule(file, pattern, index)
    const parentPath = file.path.substring(0, file.path.lastIndexOf(file.name))

    return {
      originalName: file.name,
      newName,
      originalPath: file.path,
      newPath: parentPath + newName,
    }
  })
}
