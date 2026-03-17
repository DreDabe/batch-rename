export function isElectron(): boolean {
  const result = typeof window !== 'undefined' && window.electronAPI !== undefined
  return result
}

export function getElectronAPI() {
  if (!isElectron()) {
    return null
  }
  return window.electronAPI
}
