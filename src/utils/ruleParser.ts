import type { Expression, ExpressionType } from '../types/rules'

const EXPRESSION_REGEX = /\{\$([a-zA-Z]+)(?:%([^}]+))?\}/g
const REPLACE_REGEX = /\$\[([^\]]*)\]\[([^\]]*)\]\$/g

export function parsePattern(pattern: string): Expression[] {
  const expressions: Expression[] = []
  let match

  EXPRESSION_REGEX.lastIndex = 0
  while ((match = EXPRESSION_REGEX.exec(pattern)) !== null) {
    const [raw, typeStr, format] = match
    const type = getExpressionType(typeStr)

    expressions.push({
      type,
      raw,
      format,
      start: parseStart(format),
      step: parseStep(format),
    })
  }

  return expressions
}

function getExpressionType(typeStr: string): ExpressionType {
  const typeMap: Record<string, ExpressionType> = {
    n: 'number',
    l: 'lowerLetter',
    L: 'upperLetter',
    f: 'filename',
    ext: 'extension',
    d: 'date',
    t: 'time',
  }

  return typeMap[typeStr] || 'custom'
}

function parseStart(format?: string): number | undefined {
  if (!format) return undefined

  const startMatch = format.match(/^(\d+)/)
  return startMatch ? parseInt(startMatch[1], 10) : undefined
}

function parseStep(format?: string): number | undefined {
  if (!format) return undefined

  const stepMatch = format.match(/\/(\d+)$/)
  return stepMatch ? parseInt(stepMatch[1], 10) : undefined
}

export function parseReplaces(pattern: string): { search: string; replace: string }[] {
  const replaces: { search: string; replace: string }[] = []
  let match

  REPLACE_REGEX.lastIndex = 0
  while ((match = REPLACE_REGEX.exec(pattern)) !== null) {
    replaces.push({
      search: match[1],
      replace: match[2],
    })
  }

  return replaces
}

export function extractPatternParts(pattern: string): {
  expressions: Expression[]
  replaces: { search: string; replace: string }[]
  staticParts: string[]
} {
  const expressions = parsePattern(pattern)
  const replaces = parseReplaces(pattern)

  let tempPattern = pattern
  EXPRESSION_REGEX.lastIndex = 0
  tempPattern = tempPattern.replace(EXPRESSION_REGEX, '\u0000')

  REPLACE_REGEX.lastIndex = 0
  tempPattern = tempPattern.replace(REPLACE_REGEX, '\u0001')

  const staticParts = tempPattern.split(/[\u0000\u0001]/) // eslint-disable-line no-control-regex

  return {
    expressions,
    replaces,
    staticParts,
  }
}
