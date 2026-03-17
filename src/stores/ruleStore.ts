import { create } from 'zustand'
import type { RenamePreview } from '../types/rules'
import type { FileItem, NumberType } from '../types'
import { createRenameEngine } from '../utils/ruleEngine'
import { createModuleLogger } from '../utils/logger'
import { useSettingsStore } from './settingsStore'

const log = createModuleLogger('RuleStore')

export interface RuleConfig {
  pattern: string
  numberType: NumberType
  numberStart: number | string
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
  shouldSelectAll: boolean

  setRuleConfig: (config: Partial<RuleConfig>, shouldSelectAll?: boolean) => void
  generatePreviews: (files: FileItem[]) => void
  executeRename: () => Promise<{ success: number; failed: number }>
  clearPreviews: () => void
  getPatternString: () => string
  resetShouldSelectAll: () => void
}

const DEFAULT_RULE_CONFIG: RuleConfig = {
  pattern: '',
  numberType: 'none',
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
  shouldSelectAll: false,

  setRuleConfig: (config, shouldSelectAll = false) => {
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
      shouldSelectAll,
    }))
  },

  resetShouldSelectAll: () => {
    set({ shouldSelectAll: false })
  },

  generatePreviews: async (files) => {
    const { ruleConfig } = get()
    const { settings } = useSettingsStore.getState()
    let pattern = get().getPatternString()

    // 如果用户使用了自定义规则且规则中没有包含{$ext}，则添加文件扩展名处理
    if (ruleConfig.pattern && !ruleConfig.pattern.includes('{$ext}')) {
      if (ruleConfig.suffix === '*') {
        // 当文件扩展名是*时，添加{$ext}以保持原始扩展名
        pattern = ruleConfig.pattern + '{$ext}'
      } else if (ruleConfig.suffix) {
        // 当文件扩展名是具体值时，智能添加扩展名
        // 检查自定义规则是否以点号结尾
        const endsWithDot = ruleConfig.pattern.endsWith('.')
        // 移除后缀可能包含的点号，统一处理
        const cleanSuffix = ruleConfig.suffix.replace(/^\./, '')
        
        if (endsWithDot) {
          // 规则以点号结尾，直接拼接后缀
          pattern = ruleConfig.pattern + cleanSuffix
        } else {
          // 规则不以点号结尾，添加点号和后缀
          pattern = ruleConfig.pattern + '.' + cleanSuffix
        }
      }
    }

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

    let previews = engine.preview(files)
    
    // 检查文件是否存在
    for (const preview of previews) {
      if (preview.originalPath !== preview.newPath) {
        try {
          const result = await window.electronAPI.fs.exists(preview.newPath)
          if (result) {
            preview.hasConflict = true
            preview.conflictType = 'exists'
          }
        } catch {
          // 忽略文件系统访问错误
        }
      }
    }
    
    // 如果允许覆盖，过滤掉已存在文件的冲突
    if (settings.allowOverwrite) {
      previews = previews.map(preview => ({
        ...preview,
        hasConflict: preview.hasConflict && preview.conflictType !== 'exists'
      }))
    }
    
    const conflictCount = previews.filter((p) => p.hasConflict).length
    log.logAction({
      actionType: 'load',
      message: `预览生成完成`,
      data: { previewCount: previews.length, conflictCount, allowOverwrite: settings.allowOverwrite },
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

    if (ruleConfig.numberType === 'lowerLetter') {
      parts.push('{$l}')
    } else if (ruleConfig.numberType === 'upperLetter') {
      parts.push('{$L}')
    } else if (ruleConfig.numberType === 'number') {
      const digits = ruleConfig.numberDigits
      parts.push(`{$n%0${digits}}`)
    }

    parts.push('{$f}')

    if (ruleConfig.suffix && ruleConfig.suffix !== '*') {
      // 移除后缀可能包含的点号，统一处理
      const cleanSuffix = ruleConfig.suffix.replace(/^\./, '')
      parts.push('.' + cleanSuffix)
    }

    parts.push('{$ext}')

    return parts.join('')
  },
}))
