import { describe, it, expect } from 'vitest'
import { createRenameEngine } from '../utils/ruleEngine'
import type { FileItem } from '../types'

const createMockFile = (name: string, path: string): FileItem => ({
  name,
  path,
  isDirectory: false,
  isFile: true,
  size: 1024,
  createdAt: new Date(),
  modifiedAt: new Date(),
  extension: name.split('.').pop() || '',
})

describe('ruleEngine', () => {
  describe('validate', () => {
    it('should return valid for empty pattern', () => {
      const engine = createRenameEngine({ pattern: '' })
      const result = engine.validate()
      expect(result.valid).toBe(false)
    })

    it('should return valid for correct pattern', () => {
      const engine = createRenameEngine({ pattern: '{$n%04}_{$f}{$ext}' })
      const result = engine.validate()
      expect(result.valid).toBe(true)
    })

    it('should return invalid for unknown expression', () => {
      const engine = createRenameEngine({ pattern: '{$x}' })
      const result = engine.validate()
      expect(result.valid).toBe(false)
    })
  })

  describe('preview', () => {
    it('should generate previews for files', () => {
      const engine = createRenameEngine({ pattern: '{$n%04}_{$f}{$ext}' })
      const files = [
        createMockFile('test.txt', '/test/test.txt'),
        createMockFile('demo.png', '/test/demo.png'),
      ]

      const previews = engine.preview(files)

      expect(previews).toHaveLength(2)
      expect(previews[0].newName).toBe('0001_test.txt')
      expect(previews[1].newName).toBe('0002_demo.png')
    })

    it('should handle filename expression', () => {
      const engine = createRenameEngine({ pattern: 'prefix_{$f}{$ext}' })
      const files = [createMockFile('myfile.txt', '/test/myfile.txt')]

      const previews = engine.preview(files)

      expect(previews[0].newName).toBe('prefix_myfile.txt')
    })

    it('should detect conflicts', () => {
      const engine = createRenameEngine({ pattern: 'same' })
      const files = [
        createMockFile('test1.txt', '/test/test1.txt'),
        createMockFile('test2.txt', '/test/test2.txt'),
      ]

      const previews = engine.preview(files)

      expect(previews[0].hasConflict).toBe(true)
      expect(previews[1].hasConflict).toBe(true)
    })
  })
})
