import { useState, useEffect, useCallback } from 'react'
import { useRuleStore } from '../stores/ruleStore'
import { useFileListStore } from '../stores/fileListStore'
import { getFileIcon } from '../utils/fileIcons'
import { useActionLogger } from '../hooks/useActionLogger'
import { tagManager } from '../utils/tagManager'
import type { RenamePreview, Tag } from '../types/rules'

function NumberInput() {
  const { ruleConfig, setRuleConfig } = useRuleStore()
  const { logInput, logSelect } = useActionLogger({ module: 'RulePanel', componentName: 'NumberInput' })

  const handleNumberTypeChange = useCallback((type: 'number' | 'lowerLetter' | 'upperLetter') => {
    logSelect('序号类型', type)
    if (type === 'number') {
      setRuleConfig({ numberType: type, numberStart: 1 })
    } else if (type === 'lowerLetter') {
      setRuleConfig({ numberType: type, numberStart: 'a' })
    } else {
      setRuleConfig({ numberType: type, numberStart: 'A' })
    }
  }, [setRuleConfig, logSelect])

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
    <div className="p-3 border-b">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        序号设置
      </label>

      <div className="mb-2">
        <label className="block text-xs text-gray-500 mb-1">序号类型</label>
        <select
          value={ruleConfig.numberType}
          onChange={(e) => handleNumberTypeChange(e.target.value as 'number' | 'lowerLetter' | 'upperLetter')}
          className="w-full px-2 py-1.5 text-sm text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="number">数字序号</option>
          <option value="lowerLetter">小写字母序号</option>
          <option value="upperLetter">大写字母序号</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">起始值</label>
          {ruleConfig.numberType === 'number' ? (
            <input
              type="number"
              value={ruleConfig.numberStart as number}
              onChange={(e) => handleNumberStartChange(e.target.value)}
              min={0}
              className="w-full px-2 py-1.5 text-sm text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          ) : (
            <input
              type="text"
              value={ruleConfig.numberStart as string}
              onChange={(e) => handleNumberStartChange(e.target.value)}
              maxLength={1}
              className="w-full px-2 py-1.5 text-sm text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          )}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">步长</label>
          <input
            type="number"
            value={ruleConfig.numberStep}
            onChange={(e) => handleNumberStepChange(parseInt(e.target.value))}
            min={1}
            className="w-full px-2 py-1.5 text-sm text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">位数</label>
          <input
            type="number"
            value={ruleConfig.numberDigits}
            onChange={(e) => handleNumberDigitsChange(parseInt(e.target.value))}
            min={1}
            max={10}
            className="w-full px-2 py-1.5 text-sm text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>
    </div>
  )
}

function ExtensionInput() {
  const { ruleConfig, setRuleConfig } = useRuleStore()
  const { logInput } = useActionLogger({ module: 'RulePanel', componentName: 'ExtensionInput' })

  const handleSuffixChange = useCallback((value: string) => {
    logInput('文件拓展名', value)
    setRuleConfig({ suffix: value })
  }, [setRuleConfig, logInput])

  return (
    <div className="p-3 border-b">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        文件拓展名
      </label>
      <input
        type="text"
        value={ruleConfig.suffix}
        onChange={(e) => handleSuffixChange(e.target.value)}
        className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
      <p className="mt-1 text-xs text-gray-400">
        拓展名将添加在文件名和原拓展名之间
      </p>
    </div>
  )
}

function CustomRuleInput() {
  const { ruleConfig, setRuleConfig } = useRuleStore()
  const { logInput } = useActionLogger({ module: 'RulePanel', componentName: 'CustomRuleInput' })

  const handlePatternChange = useCallback((value: string) => {
    logInput('自定义规则', value.length > 30 ? `${value.substring(0, 30)}...` : value)
    setRuleConfig({ pattern: value })
  }, [setRuleConfig, logInput])

  return (
    <div className="p-3 border-b">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        自定义规则
      </label>
      <textarea
        value={ruleConfig.pattern}
        onChange={(e) => handlePatternChange(e.target.value)}
        placeholder="例如：{$n%04}-{$f}{$ext}"
        rows={3}
        className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
      />
      <p className="mt-1 text-xs text-gray-400">
        留空则使用序号和拓展名设置
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
    const newPattern = ruleConfig.pattern + `[${tag.name}]`
    setRuleConfig({ pattern: newPattern })
    logClick('插入标签', { tagName: tag.name })
  }, [ruleConfig.pattern, setRuleConfig, logClick])

  return (
    <div className="p-3 border-b">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">标签管理</label>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs text-blue-500 hover:text-blue-600"
        >
          {showAddForm ? '取消' : '+ 添加标签'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-3 p-2 bg-gray-50 rounded-lg space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="标签名称"
              className="flex-1 px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
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
          <span className="text-xs text-gray-400">暂无标签</span>
        )}
      </div>
    </div>
  )
}

function HelpPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { logClick } = useActionLogger({ module: 'RulePanel', componentName: 'HelpPanel' })

  const handleToggle = useCallback(() => {
    logClick(isOpen ? '关闭帮助面板' : '打开帮助面板')
    setIsOpen(!isOpen)
  }, [isOpen, logClick])

  if (!isOpen) {
    return (
      <div className="p-3 border-b">
        <button
          onClick={handleToggle}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          📖 查看规则帮助
        </button>
      </div>
    )
  }

  return (
    <div className="p-3 border-b">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">规则帮助</h3>
        <button
          onClick={handleToggle}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      <div className="text-xs text-gray-600 space-y-1">
        <p><code className="bg-gray-100 px-1 rounded">{'{$n%04}'}</code> - 数字序号 (0001, 0002...)</p>
        <p><code className="bg-gray-100 px-1 rounded">{'{$l}'}</code> - 小写字母 (a, b, c...)</p>
        <p><code className="bg-gray-100 px-1 rounded">{'{$L}'}</code> - 大写字母 (A, B, C...)</p>
        <p><code className="bg-gray-100 px-1 rounded">{'{$f}'}</code> - 原始文件名</p>
        <p><code className="bg-gray-100 px-1 rounded">{'{$ext}'}</code> - 扩展名</p>
        <p><code className="bg-gray-100 px-1 rounded">{'{$d}'}</code> - 日期</p>
        <p><code className="bg-gray-100 px-1 rounded">{'{$t}'}</code> - 时间</p>
        <p><code className="bg-gray-100 px-1 rounded">{'$[old][new]$'}</code> - 替换</p>
      </div>
    </div>
  )
}

function PreviewItem({ preview, index }: { preview: RenamePreview; index: number }) {
  const icon = getFileIcon(preview.newName, false)

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 text-sm border-b ${
        preview.hasConflict ? 'bg-red-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 truncate max-w-[40%]">{preview.originalName}</span>
          <span className="text-gray-300">→</span>
          <span className={`truncate ${preview.hasConflict ? 'text-red-500' : 'text-green-600'}`}>
            {preview.newName}
          </span>
        </div>
        {preview.hasConflict && (
          <p className="text-xs text-red-400 mt-0.5">
            {preview.conflictType === 'duplicate' ? '文件名冲突' : '非法文件名'}
          </p>
        )}
      </div>
    </div>
  )
}

function PreviewList() {
  const previews = useRuleStore((state) => state.previews)
  const error = useRuleStore((state) => state.error)

  if (error) {
    return (
      <div className="p-3 text-sm text-red-500 bg-red-50">
        ⚠️ {error}
      </div>
    )
  }

  if (previews.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-400">
        选择文件后显示预览
      </div>
    )
  }

  const conflictCount = previews.filter((p) => p.hasConflict).length

  return (
    <div className="flex-1 overflow-auto">
      {conflictCount > 0 && (
        <div className="px-3 py-2 text-xs text-red-500 bg-red-50 border-b">
          ⚠️ {conflictCount} 个文件存在冲突
        </div>
      )}
      {previews.map((preview, index) => (
        <PreviewItem key={preview.originalPath} preview={preview} index={index} />
      ))}
    </div>
  )
}

function ActionButtons() {
  const { previews, isExecuting, executeRename, clearPreviews } = useRuleStore()
  const { logClick, logAction, logError } = useActionLogger({ module: 'RulePanel', componentName: 'ActionButtons' })
  const conflictCount = previews.filter((p) => p.hasConflict).length
  const canExecute = previews.length > 0 && conflictCount === 0

  const handleClear = useCallback(() => {
    logClick('清空按钮', { previewCount: previews.length })
    clearPreviews()
  }, [clearPreviews, previews.length, logClick])

  const handleExecute = useCallback(async () => {
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
        alert(`成功重命名 ${result.success} 个文件`)
        clearPreviews()
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
  }, [executeRename, clearPreviews, previews.length, logClick, logAction, logError])

  return (
    <div className="p-3 border-t bg-gray-50 flex gap-2">
      <button
        onClick={handleClear}
        className="flex-1 px-3 py-2 text-sm text-gray-600 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
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
  const generatePreviews = useRuleStore((state) => state.generatePreviews)
  const ruleConfig = useRuleStore((state) => state.ruleConfig)
  const { logAction } = useActionLogger({ module: 'RulePanel', componentName: 'RulePanel' })

  useEffect(() => {
    if (selectedFiles.length > 0) {
      logAction({
        actionType: 'load',
        message: '生成重命名预览',
        data: { fileCount: selectedFiles.length },
      })
      generatePreviews(selectedFiles)
    }
  }, [selectedFiles, ruleConfig, generatePreviews, logAction])

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-3 py-2 border-b bg-gray-50">
        <h2 className="text-sm font-medium text-gray-700">重命名规则</h2>
        <p className="text-xs text-gray-400 mt-0.5">
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
