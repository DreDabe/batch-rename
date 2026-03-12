import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { useRuleStore, type RuleConfig } from '../stores/ruleStore'
import { useFileListStore } from '../stores/fileListStore'
import { useSettingsStore } from '../stores/settingsStore'
import { getFileIcon, getFileTypeLabel } from '../utils/fileIcons'
import { useActionLogger } from '../hooks/useActionLogger'
import { tagManager } from '../utils/tagManager'
import { Tooltip } from './Tooltip'
import type { RenamePreview, Tag } from '../types/rules'

function NumberInput() {
  const { ruleConfig, setRuleConfig } = useRuleStore()
  const { settings } = useSettingsStore()
  const { theme } = settings
  const { logInput, logSelect } = useActionLogger({ module: 'RulePanel', componentName: 'NumberInput' })
  
  // 同步设置中的序号类型到规则配置
  useEffect(() => {
    if (ruleConfig.numberType !== settings.numberType) {
      setRuleConfig({ numberType: settings.numberType })
    }
  }, [settings.numberType, ruleConfig.numberType, setRuleConfig])

  const getNumberExpression = useCallback((type: 'none' | 'number' | 'lowerLetter' | 'upperLetter', digits: number) => {
    if (type === 'none') return ''
    if (type === 'lowerLetter') return '{$l}'
    if (type === 'upperLetter') return '{$L}'
    return `{$n%0${digits}}`
  }, [])

  const handleNumberTypeChange = useCallback((type: 'none' | 'number' | 'lowerLetter' | 'upperLetter') => {
    logSelect('序号类型', type)
    
    const prevType = ruleConfig.numberType
    const prevExpr = getNumberExpression(prevType, ruleConfig.numberDigits)
    const newExpr = getNumberExpression(type, ruleConfig.numberDigits)
    
    let newPattern = ruleConfig.pattern
    
    if (prevType !== 'none' && prevExpr) {
      newPattern = newPattern.replace(prevExpr, '')
    }
    
    if (type === 'none') {
      setRuleConfig({ numberType: type, pattern: newPattern.trim() || '{$f}' })
    } else {
      const startValue = type === 'number' ? 1 : (type === 'lowerLetter' ? 'a' : 'A')
      
      if (newPattern.includes('{$f}')) {
        newPattern = newPattern.replace('{$f}', `${newExpr}{$f}`)
      } else if (newPattern.trim() === '') {
        newPattern = `${newExpr}{$f}`
      } else {
        newPattern = newExpr + newPattern
      }
      
      setRuleConfig({ numberType: type, numberStart: startValue, pattern: newPattern })
    }
  }, [setRuleConfig, logSelect, ruleConfig, getNumberExpression])

  const handleNumberStartChange = useCallback((value: string) => {
    logInput('起始值', value)
    if (ruleConfig.numberType === 'number') {
      setRuleConfig({ numberStart: parseInt(value) || 1 })
    } else {
      setRuleConfig({ numberStart: value || (ruleConfig.numberType === 'lowerLetter' ? 'a' : 'A') })
    }
  }, [ruleConfig.numberType, setRuleConfig, logInput])

  const handleNumberStepChange = useCallback((value: number) => {
    logInput('步长', value)
    setRuleConfig({ numberStep: value || 1 })
  }, [setRuleConfig, logInput])

  const handleNumberDigitsChange = useCallback((value: number) => {
    logInput('位数', value)
    setRuleConfig({ numberDigits: value || 4 })
  }, [setRuleConfig, logInput])

  return (
    <div className={`p-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
        序号设置
      </label>

      <div className="mb-2">
        <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>序号类型</label>
        <select
          value={ruleConfig.numberType}
          onChange={(e) => handleNumberTypeChange(e.target.value as 'none' | 'number' | 'lowerLetter' | 'upperLetter')}
          className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${theme === 'dark' ? 'text-gray-300 border-gray-600 bg-gray-800' : 'text-gray-900 border-gray-300 bg-white'}`}
        >
          <option value="none">无</option>
          <option value="number">数字序号</option>
          <option value="lowerLetter">小写字母序号</option>
          <option value="upperLetter">大写字母序号</option>
        </select>
      </div>

      {ruleConfig.numberType !== 'none' && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>起始值</label>
            {ruleConfig.numberType === 'number' ? (
              <input
                type="number"
                value={ruleConfig.numberStart as number}
                onChange={(e) => handleNumberStartChange(e.target.value)}
                min={0}
                className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${theme === 'dark' ? 'text-gray-300 border-gray-600 bg-gray-800' : 'text-gray-900 border-gray-300 bg-white'}`}
              />
            ) : (
              <input
                type="text"
                value={ruleConfig.numberStart as string}
                onChange={(e) => handleNumberStartChange(e.target.value)}
                maxLength={1}
                className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${theme === 'dark' ? 'text-gray-300 border-gray-600 bg-gray-800' : 'text-gray-900 border-gray-300 bg-white'}`}
              />
            )}
          </div>
          <div>
            <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>步长</label>
            <input
              type="number"
              value={ruleConfig.numberStep}
              onChange={(e) => handleNumberStepChange(parseInt(e.target.value))}
              min={1}
              className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${theme === 'dark' ? 'text-gray-300 border-gray-600 bg-gray-800' : 'text-gray-900 border-gray-300 bg-white'}`}
            />
          </div>
          <div>
            <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>位数</label>
            <input
              type="number"
              value={ruleConfig.numberDigits}
              onChange={(e) => handleNumberDigitsChange(parseInt(e.target.value))}
              min={1}
              max={10}
              className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${theme === 'dark' ? 'text-gray-300 border-gray-600 bg-gray-800' : 'text-gray-900 border-gray-300 bg-white'}`}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ExtensionInput() {
  const { ruleConfig, setRuleConfig } = useRuleStore()
  const { settings } = useSettingsStore()
  const { theme } = settings
  const selectedFiles = useFileListStore((state) => state.getSelectedFiles())
  const { logInput } = useActionLogger({ module: 'RulePanel', componentName: 'ExtensionInput' })
  const [showDropdown, setShowDropdown] = useState(false)

  // 常用文件扩展名列表
  const commonExtensions = [
    'txt', 'pdf', 'jpg', 'png', 'docx', 'xlsx', 'pptx', 'md', 'json', 'csv',
    'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'svg', 'mp3', 'mp4'
  ]
  
  // 合并常用扩展名和自定义扩展名
  const allExtensions = useMemo(() => {
    return [...commonExtensions, ...settings.customExtensions.map(ext => ext.replace(/^\./, ''))]
  }, [commonExtensions, settings.customExtensions])

  const getExtensionDisplay = useCallback((files: typeof selectedFiles): string => {
    if (files.length === 0) return ''
    if (files.length === 1) {
      const ext = files[0].extension || ''
      // 移除点号，统一显示格式
      return ext.replace(/^\./, '')
    }
    const extensions = new Set(files.map(f => f.extension.replace(/^\./, '') || ''))
    if (extensions.size === 1) {
      return Array.from(extensions)[0]
    }
    return '*'
  }, [])

  const autoExtension = useMemo(() => getExtensionDisplay(selectedFiles), [selectedFiles, getExtensionDisplay])

  useEffect(() => {
    // 只在选择文件变化时自动填充，不覆盖用户手动输入
    if (selectedFiles.length > 0 && autoExtension !== ruleConfig.suffix) {
      setRuleConfig({ suffix: autoExtension })
    }
  }, [autoExtension, selectedFiles.length, setRuleConfig])

  const handleSuffixChange = useCallback((value: string) => {
    logInput('文件拓展名', value)
    setRuleConfig({ suffix: value })
  }, [setRuleConfig, logInput])

  const handleExtensionSelect = useCallback((extension: string) => {
    // 移除点号，统一存储格式
    const cleanExtension = extension.replace(/^\./, '')
    logInput('文件拓展名', cleanExtension)
    setRuleConfig({ suffix: cleanExtension })
    setShowDropdown(false)
  }, [setRuleConfig, logInput])

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest('.extension-input-container')) {
      setShowDropdown(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleClickOutside])

  return (
    <div className={`p-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
        文件拓展名
      </label>
      <div className="relative extension-input-container">
        <input
          type="text"
          value={ruleConfig.suffix}
          onChange={(e) => handleSuffixChange(e.target.value)}
          placeholder="自动填充或输入扩展名"
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${theme === 'dark' ? 'text-gray-300 border-gray-600 bg-gray-800' : 'text-gray-900 border-gray-300 bg-white'}`}
        />
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
        >
          ▼
        </button>
        {showDropdown && (
            <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg max-h-40 overflow-y-auto z-10 ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
              <div className="p-2">
                {allExtensions.map((ext) => (
                  <div
                    key={ext}
                    className={`px-3 py-1.5 text-sm cursor-pointer rounded ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
                    onClick={() => handleExtensionSelect(ext)}
                  >
                    .{ext}
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  )
}

function CustomRuleInput() {
  const { ruleConfig, setRuleConfig } = useRuleStore()
  const { settings } = useSettingsStore()
  const { theme } = settings
  const selectedFiles = useFileListStore((state) => state.getSelectedFiles())
  const { logInput } = useActionLogger({ module: 'RulePanel', componentName: 'CustomRuleInput' })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // 同步设置中的自定义规则到规则配置
  useEffect(() => {
    if (selectedFiles.length > 0 && (!ruleConfig.pattern || ruleConfig.pattern.trim() === '')) {
      setRuleConfig({ pattern: settings.customRule })
    }
  }, [settings.customRule, ruleConfig.pattern, selectedFiles.length, setRuleConfig])
  
  // 当规则变化时，聚焦并全选文本
  useEffect(() => {
    if (ruleConfig.pattern && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus()
        textareaRef.current?.select()
      }, 10)
    }
  }, [ruleConfig.pattern])

  const handlePatternChange = useCallback((value: string) => {
    logInput('自定义规则', value.length > 30 ? `${value.substring(0, 30)}...` : value)
    setRuleConfig({ pattern: value })
  }, [setRuleConfig, logInput])

  const displayPattern = useMemo(() => {
    if (!ruleConfig.pattern) return ''
    if (ruleConfig.suffix === '*') {
      return ruleConfig.pattern.replace(/\{\$ext\}/g, '*')
    }
    if (ruleConfig.suffix) {
      return ruleConfig.pattern.replace(/\{\$ext\}/g, `.${ruleConfig.suffix}`)
    }
    return ruleConfig.pattern
  }, [ruleConfig.pattern, ruleConfig.suffix])

  return (
    <div className={`p-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
        自定义规则
      </label>
      <textarea
        ref={textareaRef}
        value={ruleConfig.pattern}
        onChange={(e) => handlePatternChange(e.target.value)}
        placeholder="例如：{$n%04}-{$f}{$ext}"
        rows={3}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${theme === 'dark' ? 'text-gray-300 border-gray-600 bg-gray-800' : 'text-gray-900 border-gray-300 bg-white'}`}
      />
      <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
        预览效果: {displayPattern || '(未设置)'}
      </p>
    </div>
  )
}

function TagView() {
  const [tags, setTags] = useState<Tag[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3b82f6')
  const { logClick, logAction } = useActionLogger({ module: 'RulePanel', componentName: 'TagView' })
  const { setRuleConfig, ruleConfig } = useRuleStore()
  const { settings } = useSettingsStore()
  const { theme } = settings

  useEffect(() => {
    setTags(tagManager.getAll())
  }, [])

  const handleAddTag = useCallback(() => {
    if (newTagName.trim()) {
      const tag = tagManager.add({
        name: newTagName.trim(),
        color: newTagColor,
      })
      setTags(tagManager.getAll())
      setNewTagName('')
      setShowAddForm(false)
      logAction({
        actionType: 'create',
        message: '添加标签',
        data: { tag },
      })
    }
  }, [newTagName, newTagColor, logAction])

  const handleDeleteTag = useCallback((id: string) => {
    tagManager.delete(id)
    setTags(tagManager.getAll())
    logAction({
      actionType: 'delete',
      message: '删除标签',
      data: { tagId: id },
    })
  }, [logAction])

  const handleInsertTag = useCallback((tag: Tag) => {
    let newPattern
    if (settings.tagPosition === 'left') {
      newPattern = `[${tag.name}]` + ruleConfig.pattern
    } else {
      newPattern = ruleConfig.pattern + `[${tag.name}]`
    }
    setRuleConfig({ pattern: newPattern })
    logClick('插入标签', { tagName: tag.name, position: settings.tagPosition })
  }, [ruleConfig.pattern, setRuleConfig, logClick, settings.tagPosition])

  return (
    <div className={`p-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>标签管理</label>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`text-xs ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}
        >
          {showAddForm ? '取消' : '+ 添加标签'}
        </button>
      </div>

      {showAddForm && (
        <div className={`mb-3 p-2 rounded-lg space-y-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="标签名称"
              className={`flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${theme === 'dark' ? 'text-gray-300 border-gray-600 bg-gray-700' : 'text-gray-900 border-gray-300 bg-white'}`}
            />
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>
          <button
            onClick={handleAddTag}
            disabled={!newTagName.trim()}
            className="w-full px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            添加
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
            style={{ backgroundColor: tag.color + '20', color: tag.color }}
          >
            <button
              onClick={() => handleInsertTag(tag)}
              className="hover:opacity-70"
              title="点击插入到规则"
            >
              {tag.name}
            </button>
            <button
              onClick={() => handleDeleteTag(tag.id)}
              className="ml-1 hover:opacity-70"
              title="删除标签"
            >
              ✕
            </button>
          </div>
        ))}
        {tags.length === 0 && (
          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>暂无标签</span>
        )}
      </div>
    </div>
  )
}

function HelpPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { logClick } = useActionLogger({ module: 'RulePanel', componentName: 'HelpPanel' })
  const { settings } = useSettingsStore()
  const { theme } = settings

  const handleToggle = useCallback(() => {
    logClick(isOpen ? '关闭帮助面板' : '打开帮助面板')
    setIsOpen(!isOpen)
  }, [isOpen, logClick])

  if (!isOpen) {
    return (
      <div className={`p-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={handleToggle}
          className={`text-sm ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}
        >
          📖 查看规则帮助
        </button>
      </div>
    )
  }

  return (
    <div className={`p-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>规则帮助</h3>
        <button
          onClick={handleToggle}
          className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
        >
          ✕
        </button>
      </div>
      <div className={`text-xs space-y-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
        <p><code className={`px-1 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>{'{$n%04}'}</code> - 数字序号 (0001, 0002...)</p>
        <p><code className={`px-1 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>{'{$l}'}</code> - 小写字母 (a, b, c...)</p>
        <p><code className={`px-1 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>{'{$L}'}</code> - 大写字母 (A, B, C...)</p>
        <p><code className={`px-1 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>{'{$f}'}</code> - 原始文件名</p>
        <p><code className={`px-1 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>{'{$ext}'}</code> - 扩展名</p>
        <p><code className={`px-1 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>{'{$d}'}</code> - 日期</p>
        <p><code className={`px-1 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>{'{$t}'}</code> - 时间</p>
        <p><code className={`px-1 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>{'$[old][new]$'}</code> - 替换</p>
      </div>
    </div>
  )
}

function PreviewItem({ preview, index, theme }: { preview: RenamePreview; index: number; theme: 'light' | 'dark' }) {
  const icon = getFileIcon(preview.newName, false)
  const typeLabel = getFileTypeLabel(preview.newName, false)

  return (
    <div
      className={`flex items-start gap-2 px-3 py-1.5 text-sm border-b select-none ${
        preview.hasConflict 
          ? theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
          : index % 2 === 0 
            ? theme === 'dark' ? 'bg-gray-900' : 'bg-white'
            : theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
      }`}
    >
      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <Tooltip content={preview.originalName}>
              <span className={`truncate max-w-[40%] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>{preview.originalName}</span>
            </Tooltip>
            <span className={`flex-shrink-0 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`}>→</span>
            <Tooltip content={preview.newName}>
              <span className={`truncate min-w-0 flex-1 ${preview.hasConflict ? (theme === 'dark' ? 'text-red-400' : 'text-red-500') : (theme === 'dark' ? 'text-green-400' : 'text-green-600')}`}>
                {preview.newName}
              </span>
            </Tooltip>
          </div>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{typeLabel}</span>
          {preview.hasConflict && (
            <span className={`text-xs ${theme === 'dark' ? 'text-red-400' : 'text-red-400'}`}>
              {preview.conflictType === 'duplicate' ? '文件名冲突' : '非法文件名'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function PreviewList() {
  const previews = useRuleStore((state) => state.previews)
  const error = useRuleStore((state) => state.error)
  const { settings } = useSettingsStore()
  const { theme } = settings

  if (error) {
    return (
      <div className={`p-3 text-sm ${theme === 'dark' ? 'text-red-400 bg-red-900/20' : 'text-red-500 bg-red-50'}`}>
        ⚠️ {error}
      </div>
    )
  }

  if (previews.length === 0) {
    return (
      <div className={`p-4 text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
        选择文件后显示预览
      </div>
    )
  }

  const conflictCount = previews.filter((p) => p.hasConflict).length

  return (
    <div className="flex-1 overflow-auto">
      {conflictCount > 0 && (
        <div className={`px-3 py-2 text-xs border-b ${theme === 'dark' ? 'text-red-400 bg-red-900/20 border-gray-700' : 'text-red-500 bg-red-50 border-gray-200'}`}>
          ⚠️ {conflictCount} 个文件存在冲突
        </div>
      )}
      {previews.map((preview, index) => (
        <PreviewItem key={preview.originalPath} preview={preview} index={index} theme={theme} />
      ))}
    </div>
  )
}

function ActionButtons() {
  const { previews, isExecuting, executeRename, clearPreviews, setRuleConfig } = useRuleStore()
  const { deselectAll, getSelectedFiles } = useFileListStore()
  const { settings } = useSettingsStore()
  const { theme } = settings
  const { logClick, logAction, logError } = useActionLogger({ module: 'RulePanel', componentName: 'ActionButtons' })
  const conflictCount = previews.filter((p) => p.hasConflict).length
  const canExecute = previews.length > 0 && conflictCount === 0

  const handleClear = useCallback(() => {
    logClick('清空按钮', { previewCount: previews.length })
    clearPreviews()
    deselectAll()
    setRuleConfig({ pattern: '', numberType: 'none', suffix: '' })
  }, [clearPreviews, deselectAll, previews.length, logClick, setRuleConfig])

  const handleReset = useCallback(() => {
    logClick('恢复按钮')
    const selectedFiles = getSelectedFiles()
    const extensions = new Set(selectedFiles.map(f => f.extension || ''))
    const autoExtension = selectedFiles.length === 0 
      ? '' 
      : selectedFiles.length === 1 
        ? selectedFiles[0].extension || ''
        : extensions.size === 1 
          ? Array.from(extensions)[0] 
          : '*'
    
    setRuleConfig({ 
      pattern: '{$f}', 
      numberType: 'none',
      suffix: autoExtension
    })
  }, [getSelectedFiles, logClick, setRuleConfig])

  const handleExecute = useCallback(async () => {
    if (!canExecute || isExecuting) return
    
    logClick('执行重命名按钮', { previewCount: previews.length })
    logAction({
      actionType: 'execute',
      message: '用户触发重命名执行',
      data: { fileCount: previews.length },
    })

    try {
      const result = await executeRename()
      if (result.success > 0) {
        logAction({
          actionType: 'execute',
          message: '重命名执行成功',
          data: { success: result.success, failed: result.failed },
        })
        
        if (settings.showSuccessAlert) {
          await window.electronAPI.dialog.showMessage({
            type: 'info',
            title: 'batch-rename',
            message: `成功重命名 ${result.success} 个文件`,
            buttons: ['确定']
          })
        }
        
        clearPreviews()
        
        // 重新加载文件列表
        const currentPath = useFileListStore.getState().currentPath
        if (currentPath) {
          const reloadResult = await window.electronAPI.fs.readDirectory(currentPath)
          if (reloadResult.success && reloadResult.data) {
            useFileListStore.getState().setFiles(reloadResult.data.files)
          }
        }
      } else {
        logError({
          message: '重命名执行失败',
          data: { failed: result.failed },
        })
      }
    } catch (err) {
      logError({
        message: '重命名执行异常',
        error: err,
      })
    }
  }, [executeRename, clearPreviews, previews.length, logClick, logAction, logError, settings.showSuccessAlert, canExecute, isExecuting])

  // 监听全局快捷键 Shift + Ctrl + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.ctrlKey && e.key === 'Enter') {
        e.preventDefault()
        handleExecute()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleExecute])

  return (
    <div className={`p-3 border-t flex gap-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
      <button
        onClick={handleReset}
        className={`px-3 py-2 text-sm border rounded-lg ${theme === 'dark' ? 'text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600' : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50'}`}
      >
        恢复
      </button>
      <button
        onClick={handleClear}
        className={`flex-1 px-3 py-2 text-sm border rounded-lg disabled:opacity-50 ${theme === 'dark' ? 'text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600' : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50'}`}
        disabled={previews.length === 0}
      >
        清空
      </button>
      <button
        onClick={handleExecute}
        className="flex-1 px-3 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        disabled={!canExecute || isExecuting}
      >
        {isExecuting ? '执行中...' : `执行重命名 (${previews.length})`}
      </button>
    </div>
  )
}

export function RulePanel() {
  const selectedFiles = useFileListStore((state) => state.getSelectedFiles())
  const selectedFilesPaths = useFileListStore((state) => Array.from(state.selectedFiles).sort())
  const generatePreviews = useRuleStore((state) => state.generatePreviews)
  const clearPreviews = useRuleStore((state) => state.clearPreviews)
  const { ruleConfig, setRuleConfig } = useRuleStore()
  const { logAction } = useActionLogger({ module: 'RulePanel', componentName: 'RulePanel' })
  const lastProcessedPathsRef = useRef<string>('')
  const lastRuleConfigRef = useRef<RuleConfig>(ruleConfig)
  const { settings } = useSettingsStore()
  const { theme } = settings

  useEffect(() => {
    const currentPathsKey = selectedFilesPaths.join(',')
    if (currentPathsKey === lastProcessedPathsRef.current) {
      return
    }

    lastProcessedPathsRef.current = currentPathsKey

    const handleGeneratePreviews = async () => {
      if (selectedFiles.length > 0) {
        logAction({
          actionType: 'load',
          message: '生成重命名预览',
          data: { fileCount: selectedFiles.length },
        })
        
        if (!ruleConfig.pattern || ruleConfig.pattern.trim() === '') {
          setRuleConfig({ pattern: '{$f}' })
        }
        
        await generatePreviews(selectedFiles)
      } else {
        clearPreviews()
        setRuleConfig({ pattern: '', numberType: 'none', suffix: '' })
      }
    }

    handleGeneratePreviews()
  }, [selectedFilesPaths, selectedFiles, generatePreviews, clearPreviews, logAction, ruleConfig.pattern, setRuleConfig])

  // 监听规则配置变化，重新生成预览
  useEffect(() => {
    // 比较 ruleConfig 是否真正变化
    const isRuleConfigChanged = JSON.stringify(ruleConfig) !== JSON.stringify(lastRuleConfigRef.current)
    
    if (isRuleConfigChanged && selectedFiles.length > 0) {
      lastRuleConfigRef.current = { ...ruleConfig }
      generatePreviews(selectedFiles)
    }
  }, [ruleConfig, selectedFiles, generatePreviews])

  return (
    <div className={`h-full flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <div className={`px-3 py-2 border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <h2 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>重命名规则</h2>
        <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
          已选择 {selectedFiles.length} 个文件
        </p>
      </div>

      <div className="overflow-auto flex-1">
        <NumberInput />
        <ExtensionInput />
        <CustomRuleInput />
        <TagView />
        <HelpPanel />
        <PreviewList />
      </div>

      <ActionButtons />
    </div>
  )
}
