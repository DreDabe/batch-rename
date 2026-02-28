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
    const prevConfig = get().ruleConfig
    log.logAction({
      actionType: 'input',
      message: '更新规则配置',
      previousState: prevConfig,
      newState: { ...prevConfig, ...config },
      data: { changes: config },
    })
    set((state) => ({
      ruleConfig: { ...state.ruleConfig, ...config },
    }))
  },

  generatePreviews: (files) => {
    const pattern = get().getPatternString()

    log.logAction({
      actionType: 'load',
      message: `生成预览`,
      data: { fileCount: files.length, pattern },
    })

    if (!pattern || files.length === 0) {
      set({ previews: [], error: null })
      return
    }

    const engine = createRenameEngine({ pattern })
    const validation = engine.validate()

    if (!validation.valid) {
      log.logError({
        message: '规则验证失败',
        data: { error: validation.error },
      })
      set({ previews: [], error: validation.error || '规则无效' })
      return
    }

    const previews = engine.preview(files)
    const conflictCount = previews.filter((p) => p.hasConflict).length
    log.logAction({
      actionType: 'load',
      message: `预览生成完成`,
      data: { previewCount: previews.length, conflictCount },
    })
    set({ previews, error: null })
  },

  executeRename: async () => {
    const { previews } = get()
    log.logAction({
      actionType: 'execute',
      message: `开始执行重命名`,
      data: { fileCount: previews.length },
    })
    set({ isExecuting: true, error: null })

    let success = 0
    let failed = 0
    const timer = log.startTimer()

    for (const preview of previews) {
      if (preview.hasConflict) {
        log.logError({
          message: '跳过冲突文件',
          data: { originalName: preview.originalName, conflictType: preview.conflictType },
        })
        failed++
        continue
      }

      try {
        const result = await window.electronAPI.fs.rename(
          preview.originalPath,
          preview.newPath
        )
        if (result.success) {
          log.logAction({
            actionType: 'update',
            message: '重命名成功',
            data: { from: preview.originalName, to: preview.newName },
          })
          success++
        } else {
          log.logError({
            message: '重命名失败',
            data: { originalName: preview.originalName, error: result.error },
          })
          failed++
        }
      } catch (err) {
        log.logError({
          message: '重命名异常',
          error: err,
          data: { originalName: preview.originalName },
        })
        failed++
      }
    }

    const duration = timer()
    log.logAction({
      actionType: 'execute',
      message: `重命名执行完成`,
      data: { success, failed, duration },
    })
    set({ isExecuting: false })
    return { success, failed }
  },

  clearPreviews: () => {
    const prevCount = get().previews.length
    log.logAction({
      actionType: 'delete',
      message: '清空预览',
      data: { previousCount: prevCount },
    })
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
