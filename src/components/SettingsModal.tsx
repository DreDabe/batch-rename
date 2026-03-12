import { useState, useEffect, useCallback, useRef } from 'react'
import { useActionLogger } from '../hooks/useActionLogger'
import { useSettingsStore } from '../stores/settingsStore'
import type { NumberType, TagPosition, AppConfig } from '../types'

interface SettingsModalProps {
  onClose: () => void
}

const COMMON_EXTENSIONS = [
  { value: '*', label: '保持原扩展名' },
  { value: '.txt', label: '.txt - 文本文件' },
  { value: '.jpg', label: '.jpg - JPEG图片' },
  { value: '.png', label: '.png - PNG图片' },
  { value: '.pdf', label: '.pdf - PDF文档' },
  { value: '.doc', label: '.doc - Word文档' },
  { value: '.mp3', label: '.mp3 - 音频文件' },
  { value: '.mp4', label: '.mp4 - 视频文件' },
]

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, isLoading, loadSettings, updateSettings } = useSettingsStore()
  const { theme } = settings
  const [originalSettings, setOriginalSettings] = useState(settings)
  const [saveMessage, setSaveMessage] = useState('')
  const [showExtensionDialog, setShowExtensionDialog] = useState(false)
  const [newExtension, setNewExtension] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const { logClick, logAction, logInput } = useActionLogger({
    module: 'SettingsModal',
    componentName: 'SettingsModal',
  })

  useEffect(() => {
    // 加载设置
    const fetchSettings = async () => {
      await loadSettings()
      setOriginalSettings(settings)
    }
    fetchSettings()
  }, [loadSettings])

  useEffect(() => {
    if (originalSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings)
      setHasChanges(changed)
    }
  }, [settings, originalSettings])

  const handleSettingChange = useCallback(async <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
    await updateSettings(key, value)
  }, [updateSettings])

  const saveSettings = useCallback(async () => {
    setSaveMessage('设置保存成功')
    setOriginalSettings(settings)
    setHasChanges(false)
    setTimeout(() => setSaveMessage(''), 2000)
  }, [settings])

  const handleClose = useCallback(async () => {
    logClick('关闭设置按钮')
    
    if (hasChanges) {
      const result = await window.electronAPI.dialog.showMessage({
        type: 'warning',
        title: '确认关闭',
        message: '您有未保存的设置更改，是否保存？',
        buttons: ['不保存', '取消', '保存'],
      })
      
      if (result.response === 1) {
        return
      } else if (result.response === 2) {
        await saveSettings()
      }
    }
    
    onClose()
  }, [hasChanges, saveSettings, onClose, logClick])

  const handleAddExtension = useCallback(() => {
    logClick('添加扩展名按钮')
    setNewExtension('')
    setShowExtensionDialog(true)
  }, [logClick])

  const handleExtensionSubmit = useCallback(async () => {
    if (!newExtension.trim()) return
    
    let ext = newExtension.trim()
    if (!ext.startsWith('.')) {
      ext = '.' + ext
    }
    
    if (!settings.customExtensions.includes(ext)) {
      await updateSettings('customExtensions', [...settings.customExtensions, ext])
    }
    
    setShowExtensionDialog(false)
    setNewExtension('')
    logInput('新扩展名', ext)
    logAction({
      actionType: 'click',
      message: '添加自定义扩展名',
      data: { extension: ext },
    })
  }, [newExtension, settings.customExtensions, updateSettings, logInput, logAction])

  const handleRemoveExtension = useCallback(async (ext: string) => {
    await updateSettings('customExtensions', settings.customExtensions.filter(e => e !== ext))
  }, [settings.customExtensions, updateSettings])

  const handleOpenHelp = useCallback(() => {
    logClick('查看规则帮助链接')
    window.electronAPI.dialog.showMessage({
      type: 'info',
      title: '规则语法帮助',
      message: `重命名规则语法说明：

{$f} - 原文件名（不含扩展名）
{$ext} - 文件扩展名
{$n} - 数字序号
{$n%04d} - 4位数字序号，如0001
{$l} - 小写字母序号，如a, b, c
{$L} - 大写字母序号，如A, B, C
{$d} - 当前日期
{$t} - 当前时间

示例：
{$f}_{$n%04d}{$ext} → file_0001.txt
{$L}_{$f}{$ext} → A_file.txt`,
      buttons: ['确定'],
    })
  }, [logClick])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className={`${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'} rounded-lg shadow-xl w-[550px] min-h-[500px] max-h-[85vh] flex flex-col resize overflow-hidden border`}
        style={{ resize: 'both' }}
      >
        {/* 标题栏 */}
        <div className={`flex items-center justify-between px-5 py-3 border-b ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} shrink-0`}>
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>设置</h3>
          <button 
            onClick={handleClose} 
            className={`${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors text-xl leading-none`}
          >
            ✕
          </button>
        </div>

        {/* 内容区域 - 支持滚动 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* 保存消息提示 */}
          {saveMessage && (
            <div className={`text-sm py-2 px-3 rounded ${
              saveMessage.includes('成功') 
                ? theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700' 
                : theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
            }`}>
              {saveMessage}
            </div>
          )}

          {/* 常规设置模块 */}
          <section className="space-y-6">
            <h4 className={`text-base font-semibold pb-2 border-b ${theme === 'dark' ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'}`}>常规设置</h4>
            
            {/* 外观设置 */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>外观</label>
              <select
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value as 'light' | 'dark')}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="light">浅色</option>
                <option value="dark">深色</option>
              </select>
            </div>

            {/* 默认设置 */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>默认设置</label>
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm cursor-pointer ${
                  theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                }`}>
                  <input 
                    type="checkbox" 
                    className={`w-4 h-4 rounded text-blue-500 focus:ring-blue-500 ${
                      theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                    }`} 
                    checked={settings.openLastPath} 
                    onChange={(e) => handleSettingChange('openLastPath', e.target.checked)}
                  />
                  <span>启动时打开上次目录</span>
                </label>
              </div>
            </div>

            {/* 重命名设置 */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>重命名设置</label>
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm cursor-pointer ${
                  theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                }`}>
                  <input 
                    type="checkbox" 
                    className={`w-4 h-4 rounded text-blue-500 focus:ring-blue-500 ${
                      theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                    }`} 
                    checked={settings.showSuccessAlert} 
                    onChange={(e) => handleSettingChange('showSuccessAlert', e.target.checked)}
                  />
                  <span>显示成功重命名弹窗</span>
                </label>
                <label className={`flex items-center gap-2 text-sm cursor-pointer ${
                  theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                }`}>
                  <input 
                    type="checkbox" 
                    className={`w-4 h-4 rounded text-blue-500 focus:ring-blue-500 ${
                      theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                    }`} 
                    checked={settings.allowOverwrite} 
                    onChange={(e) => handleSettingChange('allowOverwrite', e.target.checked)}
                  />
                  <span>允许覆盖已有文件</span>
                </label>
              </div>
            </div>
          </section>

          {/* 规则管理模块 */}
          <section className="space-y-6">
            <h4 className={`text-base font-semibold pb-2 border-b ${theme === 'dark' ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'}`}>规则管理</h4>
            
            {/* 序号设置 */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>序号设置</label>
              <select
                value={settings.numberType}
                onChange={(e) => handleSettingChange('numberType', e.target.value as NumberType)}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="none">无</option>
                <option value="number">数字序号</option>
                <option value="lowerLetter">小写字母序号</option>
                <option value="upperLetter">大写字母序号</option>
              </select>
            </div>

            {/* 文件扩展名设置 */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>文件扩展名设置</label>
              <div className="flex items-center gap-2">
                <select
                  className={`flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  defaultValue=""
                >
                  <option value="" disabled>选择常用扩展名</option>
                  {COMMON_EXTENSIONS.map(ext => (
                    <option key={ext.value} value={ext.value}>{ext.label}</option>
                  ))}
                  {settings.customExtensions.map(ext => (
                    <option key={ext} value={ext}>{ext}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddExtension}
                  className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  +
                </button>
              </div>
              {settings.customExtensions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {settings.customExtensions.map(ext => (
                    <span 
                      key={ext} 
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                        theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {ext}
                      <button
                        onClick={() => handleRemoveExtension(ext)}
                        className={`${theme === 'dark' ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 自定义规则设置 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>自定义规则设置</label>
                <button
                  onClick={handleOpenHelp}
                  className="text-xs text-blue-500 hover:text-blue-600 hover:underline"
                >
                  查看规则帮助
                </button>
              </div>
              <input
                type="text"
                value={settings.customRule}
                onChange={(e) => handleSettingChange('customRule', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="{$f}"
              />
            </div>

            {/* 标签设置 */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>标签设置</label>
              <select
                value={settings.tagPosition}
                onChange={(e) => handleSettingChange('tagPosition', e.target.value as TagPosition)}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="left">左边</option>
                <option value="right">右边</option>
              </select>
            </div>
          </section>

          {/* 快捷键设置模块 */}
          <section className="space-y-3">
            <h4 className={`text-base font-semibold pb-2 border-b ${theme === 'dark' ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'}`}>快捷键设置</h4>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <p className="mb-3">以下是本应用支持的快捷键列表：</p>
              <div className="space-y-2">
                {[
                  { keys: 'Ctrl + O', description: '打开目录' },
                  { keys: 'Ctrl + A', description: '全选文件' },
                  { keys: 'Ctrl + C', description: '复制文件' },
                  { keys: 'Ctrl + X', description: '剪切文件' },
                  { keys: 'Ctrl + V', description: '粘贴文件' },
                  { keys: 'Ctrl + Z', description: '撤销操作' },
                  { keys: 'Delete', description: '删除选中文件' },
                  { keys: 'F5', description: '刷新文件列表' },
                  { keys: 'Ctrl + Enter', description: '执行重命名' },
                  { keys: 'Shift + Ctrl + Enter', description: '执行重命名（全局）' },
                ].map((shortcut) => (
                  <div key={shortcut.keys} className="flex items-center justify-between py-1.5 px-3 rounded-md hover:bg-opacity-50 transition-colors">
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{shortcut.description}</span>
                    <kbd className={`px-2.5 py-1 text-xs font-mono rounded border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-gray-200' 
                        : 'bg-gray-100 border-gray-300 text-gray-700'
                    }`}>
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 关于模块 */}
          <section className="space-y-3 pt-4 border-t">
            <h4 className={`text-base font-semibold pb-2 ${theme === 'dark' ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'}`}>关于</h4>
            <div className={`text-sm space-y-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
              <p><span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>版本号：</span>v1.0.0</p>
              <p><span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>项目描述：</span>批量重命名工具 - 一款功能强大的文件批量重命名应用</p>
              <p><span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>技术框架：</span>基于 Electron + React + TypeScript 构建，主要是重命名规则的自定义规则设置内容</p>
            </div>
          </section>
        </div>

        {/* 底部按钮区域 */}
        <div className={`px-5 py-3 border-t flex justify-end gap-3 shrink-0 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <button
            onClick={handleClose}
            className={`px-4 py-2 text-sm rounded-md hover:transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            关闭窗口
          </button>
          <button
            onClick={saveSettings}
            disabled={isLoading || !hasChanges}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>

      {/* 添加扩展名对话框 */}
      {showExtensionDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className={`rounded-lg shadow-xl w-[350px] p-4 ${
            theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <h3 className={`text-base font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>添加自定义扩展名</h3>
            <div className="mb-4">
              <input
                type="text"
                value={newExtension}
                onChange={(e) => setNewExtension(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="例如：.zip 或 zip"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleExtensionSubmit()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowExtensionDialog(false)}
                className={`px-4 py-2 text-sm rounded-md hover:transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                取消
              </button>
              <button
                onClick={handleExtensionSubmit}
                disabled={!newExtension.trim()}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
