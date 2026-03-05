export function isElectron(): boolean {
  const result = typeof window !== 'undefined' && window.electronAPI !== undefined
  console.log('[electronHelper] isElectron() 检查结果:', result)
  console.log('[electronHelper] typeof window:', typeof window)
  if (typeof window !== 'undefined') {
    console.log('[electronHelper] window.electronAPI:', window.electronAPI)
    console.log('[electronHelper] window 对象的 keys:', Object.keys(window).filter(k => k.toLowerCase().includes('electron')))
  }
  return result
}

export function getElectronAPI() {
  console.log('[electronHelper] getElectronAPI() 被调用')
  if (!isElectron()) {
    console.log('[electronHelper] 不是 Electron 环境，返回 null')
    return null
  }
  console.log('[electronHelper] 是 Electron 环境，返回 electronAPI')
  return window.electronAPI
}
