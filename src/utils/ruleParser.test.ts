import { describe, it, expect } from 'vitest'
import { parsePattern, parseReplaces } from '../utils/ruleParser'

describe('ruleParser', () => {
  describe('parsePattern', () => {
    it('should parse number expression', () => {
      const result = parsePattern('{$n%04}')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('number')
      expect(result[0].raw).toBe('{$n%04}')
    })

    it('should parse letter expression', () => {
      const result = parsePattern('{$l}')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('lowerLetter')
    })

    it('should parse uppercase letter expression', () => {
      const result = parsePattern('{$L}')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('upperLetter')
    })

    it('should parse filename expression', () => {
      const result = parsePattern('{$f}')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('filename')
    })

    it('should parse extension expression', () => {
      const result = parsePattern('{$ext}')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('extension')
    })

    it('should parse multiple expressions', () => {
      const result = parsePattern('{$n%04}_{$f}{$ext}')
      expect(result).toHaveLength(3)
      expect(result[0].type).toBe('number')
      expect(result[1].type).toBe('filename')
      expect(result[2].type).toBe('extension')
    })
  })

  describe('parseReplaces', () => {
    it('should parse replace expression', () => {
      const result = parseReplaces('$[old][new]$')
      expect(result).toHaveLength(1)
      expect(result[0].search).toBe('old')
      expect(result[0].replace).toBe('new')
    })

    it('should return empty array for no replaces', () => {
      const result = parseReplaces('test')
      expect(result).toHaveLength(0)
    })
  })
})
