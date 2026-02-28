import { create } from 'zustand'
import type { RenamePreview } from '../types/rules'
import type { FileItem } from '../types'
import { createRenameEngine } from '../utils/ruleEngine'
import { createModuleLogger } from '../utils/logger'

const log = createModuleLogger('RuleStore')

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

    log.debug(`生成预览，文件数: ${files.length}, 规则: ${pattern}`)

    if (!pattern || files.length === 0) {
      set({ previews: [], error: null })
      return
    }

    const engine = createRenameEngine({ pattern })
    const validation = engine.validate()

    if (!validation.valid) {
      log.warn(`规则验证失败: ${validation.error}`)
      set({ previews: [], error: validation.error || '规则无效' })
      return
    }

    const previews = engine.preview(files)
    log.info(`生成 ${previews.length} 个预览`)
    set({ previews, error: null })
  },

  executeRename: async () => {
    const { previews } = get()
    log.info(`开始执行重命名，共 ${previews.length} 个文件`)
    set({ isExecuting: true, error: null })

    let success = 0
    let failed = 0

    for (const preview of previews) {
      if (preview.hasConflict) {
        log.warn(`跳过冲突文件: ${preview.originalName}`)
        failed++
        continue
      }

      try {
        const result = await window.electronAPI.fs.rename(
          preview.originalPath,
          preview.newPath
        )
        if (result.success) {
          log.debug(`重命名成功: ${preview.originalName} -> ${preview.newName}`)
          success++
        } else {
          log.error(`重命名失败: ${preview.originalName} - ${result.error}`)
          failed++
        }
      } catch (err) {
        log.error(`重命名异常: ${preview.originalName} - ${err instanceof Error ? err.message : '未知错误'}`)
        failed++
      }
    }

    log.info(`执行完成，成功: ${success}, 失败: ${failed}`)
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
