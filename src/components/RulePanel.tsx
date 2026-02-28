import { useState, useEffect } from 'react'
import { useRuleStore } from '../stores/ruleStore'
import { useFileListStore } from '../stores/fileListStore'
import { getFileIcon } from '../utils/fileIcons'
import type { RenamePreview } from '../types/rules'

function RuleInput() {
  const { ruleConfig, setRuleConfig } = useRuleStore()

  return (
    <div className="p-3 border-b">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        自定义规则
      </label>
      <input
        type="text"
        value={ruleConfig.pattern}
        onChange={(e) => setRuleConfig({ pattern: e.target.value })}
        placeholder="例如: {$n%04}_{$f}{$ext}"
        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="mt-1 text-xs text-gray-400">
        留空则使用下方快速设置
      </p>
    </div>
  )
}

function QuickRuleSettings() {
  const { ruleConfig, setRuleConfig } = useRuleStore()

  return (
    <div className="p-3 border-b space-y-3">
      <h3 className="text-sm font-medium text-gray-700">快速设置</h3>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">前缀</label>
          <input
            type="text"
            value={ruleConfig.prefix}
            onChange={(e) => setRuleConfig({ prefix: e.target.value })}
            placeholder="前缀"
            className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">后缀</label>
          <input
            type="text"
            value={ruleConfig.suffix}
            onChange={(e) => setRuleConfig({ suffix: e.target.value })}
            placeholder="后缀"
            className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={ruleConfig.useLetter}
            onChange={(e) => setRuleConfig({ useLetter: e.target.checked })}
            className="rounded"
          />
          <span>字母序号</span>
        </label>
        {ruleConfig.useLetter && (
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={ruleConfig.letterUppercase}
              onChange={(e) => setRuleConfig({ letterUppercase: e.target.checked })}
              className="rounded"
            />
            <span>大写</span>
          </label>
        )}
      </div>

      {!ruleConfig.useLetter && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">起始值</label>
            <input
              type="number"
              value={ruleConfig.numberStart}
              onChange={(e) => setRuleConfig({ numberStart: parseInt(e.target.value) || 1 })}
              min={0}
              className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">步长</label>
            <input
              type="number"
              value={ruleConfig.numberStep}
              onChange={(e) => setRuleConfig({ numberStep: parseInt(e.target.value) || 1 })}
              min={1}
              className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">位数</label>
            <input
              type="number"
              value={ruleConfig.numberDigits}
              onChange={(e) => setRuleConfig({ numberDigits: parseInt(e.target.value) || 4 })}
              min={1}
              max={10}
              className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function HelpPanel() {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <div className="p-3 border-b">
        <button
          onClick={() => setIsOpen(true)}
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
          onClick={() => setIsOpen(false)}
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
  const conflictCount = previews.filter((p) => p.hasConflict).length
  const canExecute = previews.length > 0 && conflictCount === 0

  const handleExecute = async () => {
    const result = await executeRename()
    if (result.success > 0) {
      alert(`成功重命名 ${result.success} 个文件`)
      clearPreviews()
    }
  }

  return (
    <div className="p-3 border-t bg-gray-50 flex gap-2">
      <button
        onClick={clearPreviews}
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

  useEffect(() => {
    if (selectedFiles.length > 0) {
      generatePreviews(selectedFiles)
    }
  }, [selectedFiles, ruleConfig, generatePreviews])

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-3 py-2 border-b bg-gray-50">
        <h2 className="text-sm font-medium text-gray-700">重命名规则</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          已选择 {selectedFiles.length} 个文件
        </p>
      </div>

      <div className="overflow-auto flex-1">
        <RuleInput />
        <QuickRuleSettings />
        <HelpPanel />
        <PreviewList />
      </div>

      <ActionButtons />
    </div>
  )
}
