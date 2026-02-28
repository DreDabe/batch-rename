import { contextBridge, ipcRenderer } from 'electron'

export const electronAPI = {
  // File System
  fs: {
    readDirectory: (dirPath: string) => ipcRenderer.invoke('fs:readDirectory', dirPath),
    rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
    delete: (pathToDelete: string, recursive?: boolean) =>
      ipcRenderer.invoke('fs:delete', pathToDelete, recursive),
    createFolder: (parentPath: string, name: string) =>
      ipcRenderer.invoke('fs:createFolder', parentPath, name),
    copy: (source: string, destination: string) =>
      ipcRenderer.invoke('fs:copy', source, destination),
    move: (source: string, destination: string) =>
      ipcRenderer.invoke('fs:move', source, destination),
    exists: (targetPath: string) => ipcRenderer.invoke('fs:exists', targetPath),
    readFile: (targetPath: string, maxSize?: number) =>
      ipcRenderer.invoke('fs:readFile', targetPath, maxSize),
    readImageBase64: (targetPath: string) =>
      ipcRenderer.invoke('fs:readImageBase64', targetPath),
  },

  // Dialog
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    showMessage: (options: {
      type: 'none' | 'info' | 'error' | 'question' | 'warning'
      title: string
      message: string
      buttons?: string[]
    }) => ipcRenderer.invoke('dialog:showMessage', options),
  },

  // History
  history: {
    undo: () => ipcRenderer.invoke('history:undo'),
    getHistory: () => ipcRenderer.invoke('history:getHistory'),
    canUndo: () => ipcRenderer.invoke('history:canUndo'),
    clear: () => ipcRenderer.invoke('history:clear'),
  },

  // Config
  config: {
    load: () => ipcRenderer.invoke('config:load'),
    get: () => ipcRenderer.invoke('config:get'),
    update: (key: string, value: unknown) => ipcRenderer.invoke('config:update', key, value),
    addFavorite: (path: string) => ipcRenderer.invoke('config:addFavorite', path),
    removeFavorite: (path: string) => ipcRenderer.invoke('config:removeFavorite', path),
  },

  // Version
  version: {
    checkUpdate: () => ipcRenderer.invoke('version:checkUpdate'),
    current: () => ipcRenderer.invoke('version:current'),
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
