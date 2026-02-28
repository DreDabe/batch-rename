import { create } from 'zustand'
import type { RenamePreview } from '../types/rules'
import type { FileItem } from '../types'
import { createRenameEngine } from '../utils/ruleEngine'

export interface RuleConfig {
  pattern: string
  numberStart: number
  numberStep: number
  numberDigits: number
  useLetter: boolean
  letterUppercase: boolean
  prefix: string
  suffix: string
}

interface RuleState {
  ruleConfig: RuleConfig
  previews: RenamePreview[]
  isExecuting: boolean
  error: string | null

  setRuleConfig: (config: Partial<RuleConfig>) => void
  generatePreviews: (files: FileItem[]) => void
  executeRename: () => Promise<{ success: number; failed: number }>
  clearPreviews: () => void
  getPatternString: () => string
}

const DEFAULT_RULE_CONFIG: RuleConfig = {
  pattern: '',
  numberStart: 1,
  numberStep: 1,
  numberDigits: 4,
  useLetter: false,
  letterUppercase: false,
  prefix: '',
  suffix: '',
}

export const useRuleStore = create<RuleState>((set, get) => ({
  ruleConfig: { ...DEFAULT_RULE_CONFIG },
  previews: [],
  isExecuting: false,
  error: null,

  setRuleConfig: (config) => {
    set((state) => ({
      ruleConfig: { ...state.ruleConfig, ...config },
    }))
  },

  generatePreviews: (files) => {
    const pattern = get().getPatternString()

    if (!pattern || files.length === 0) {
      set({ previews: [], error: null })
      return
    }

    const engine = createRenameEngine({ pattern })
    const validation = engine.validate()

    if (!validation.valid) {
      set({ previews: [], error: validation.error || '规则无效' })
      return
    }

    const previews = engine.preview(files)
    set({ previews, error: null })
  },

  executeRename: async () => {
    const { previews } = get()
    set({ isExecuting: true, error: null })

    let success = 0
    let failed = 0

    for (const preview of previews) {
      if (preview.hasConflict) {
        failed++
        continue
      }

      try {
        const result = await window.electronAPI.fs.rename(
          preview.originalPath,
          preview.newPath
        )
        if (result.success) {
          success++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    set({ isExecuting: false })
    return { success, failed }
  },

  clearPreviews: () => {
    set({ previews: [], error: null })
  },

  getPatternString: () => {
    const { ruleConfig } = get()

    if (ruleConfig.pattern) {
      return ruleConfig.pattern
    }

    const parts: string[] = []

    if (ruleConfig.prefix) {
      parts.push(ruleConfig.prefix)
    }

    if (ruleConfig.useLetter) {
      parts.push(ruleConfig.letterUppercase ? '{$L}' : '{$l}')
    } else {
      const digits = ruleConfig.numberDigits
      parts.push(`{$n%0${digits}}`)
    }

    parts.push('{$f}')

    if (ruleConfig.suffix) {
      parts.push(ruleConfig.suffix)
    }

    parts.push('{$ext}')

    return parts.join('')
  },
}))
