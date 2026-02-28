import { useState, useEffect } from 'react'
import { useRuleStore } from '../stores/ruleStore'
import { ruleManager, type SavedRule } from '../utils/ruleManager'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'settings'>('rules')
  const [savedRules, setSavedRules] = useState<SavedRule[]>([])
  const ruleConfig = useRuleStore((state) => state.ruleConfig)
  const setRuleConfig = useRuleStore((state) => state.setRuleConfig)

  const loadRules = () => {
    setSavedRules(ruleManager.getAll())
  }

  useEffect(() => {
    loadRules()
  }, [])

  const handleSaveRule = () => {
    const name = prompt('请输入规则名称')
    if (!name) return

    ruleManager.save(name, ruleConfig)
    loadRules()
  }

  const handleLoadRule = (rule: SavedRule) => {
    setRuleConfig(rule.config)
    onClose()
  }

  const handleDeleteRule = (id: string) => {
    if (confirm('确定要删除此规则吗？')) {
      ruleManager.delete(id)
      loadRules()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-medium">设置</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 px-4 py-2 text-sm ${
              activeTab === 'rules'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500'
            }`}
          >
            规则管理
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-4 py-2 text-sm ${
              activeTab === 'settings'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500'
            }`}
          >
            常规设置
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'rules' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium">已保存的规则</h4>
                <button
                  onClick={handleSaveRule}
                  className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  保存当前规则
                </button>
              </div>

              {savedRules.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  暂无保存的规则
                </p>
              ) : (
                <ul className="space-y-2">
                  {savedRules.map((rule) => (
                    <li
                      key={rule.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">{rule.name}</p>
                        <p className="text-xs text-gray-400">
                          {rule.config.pattern || '快速设置规则'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadRule(rule)}
                          className="px-2 py-1 text-xs text-blue-500 hover:bg-blue-50 rounded"
                        >
                          加载
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded"
                        >
                          删除
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">外观</h4>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>深色模式（开发中）</span>
                </label>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">默认设置</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>启动时打开上次目录</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>重命名后自动刷新列表</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">关于</h4>
                <p className="text-xs text-gray-400">
                  批量重命名工具 v1.0.0
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  基于 Electron + React + TypeScript
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
