const { contextBridge, ipcRenderer } = require('electron');

const electronAPI = {
  fs: {
    readDirectory: (dirPath: string) => ipcRenderer.invoke('fs:readDirectory', dirPath),
    rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
    delete: (pathToDelete: string, recursive: boolean) => ipcRenderer.invoke('fs:delete', pathToDelete, recursive),
    createFolder: (parentPath: string, name: string) => ipcRenderer.invoke('fs:createFolder', parentPath, name),
    copy: (source: string, destination: string) => ipcRenderer.invoke('fs:copy', source, destination),
    move: (source: string, destination: string) => ipcRenderer.invoke('fs:move', source, destination),
    exists: (targetPath: string) => ipcRenderer.invoke('fs:exists', targetPath),
    readFile: (targetPath: string, maxSize: number) => ipcRenderer.invoke('fs:readFile', targetPath, maxSize),
    readImageBase64: (targetPath: string) => ipcRenderer.invoke('fs:readImageBase64', targetPath),
    getDrives: () => ipcRenderer.invoke('fs:getDrives'),
    hasChildren: (dirPath: string) => ipcRenderer.invoke('fs:hasChildren', dirPath),
    createFile: (parentPath: string, name: string, content: string) => ipcRenderer.invoke('fs:createFile', parentPath, name, content),
  },

  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    showMessage: (options: any) => ipcRenderer.invoke('dialog:showMessage', options),
    saveFile: (options: any) => ipcRenderer.invoke('dialog:saveFile', options),
  },

  history: {
    undo: () => ipcRenderer.invoke('history:undo'),
    getHistory: () => ipcRenderer.invoke('history:getHistory'),
    canUndo: () => ipcRenderer.invoke('history:canUndo'),
    clear: () => ipcRenderer.invoke('history:clear'),
    recordOperation: (operation: string, params: any, rollbackInfo: any) => ipcRenderer.invoke('history:recordOperation', operation, params, rollbackInfo),
  },

  config: {
    load: () => ipcRenderer.invoke('config:load'),
    get: () => ipcRenderer.invoke('config:get'),
    update: (key: string, value: any) => ipcRenderer.invoke('config:update', key, value),
    setConfig: (config: any) => ipcRenderer.invoke('config:setConfig', config),
    addFavorite: (path: string) => ipcRenderer.invoke('config:addFavorite', path),
    removeFavorite: (path: string) => ipcRenderer.invoke('config:removeFavorite', path),
  },

  version: {
    checkUpdate: () => ipcRenderer.invoke('version:checkUpdate'),
    current: () => ipcRenderer.invoke('version:current'),
  },

  debug: {
    log: (message: string, data: any) => ipcRenderer.send('debug:log', message, data),
  },

  menu: {
    onNewFile: (callback: () => void) => ipcRenderer.on('menu:new-file', callback),
    onNewFolder: (callback: () => void) => ipcRenderer.on('menu:new-folder', callback),
    onOpenFile: (callback: (event: any, path: string) => void) => ipcRenderer.on('menu:open-file', callback),
    onOpenDirectory: (callback: (event: any, path: string) => void) => ipcRenderer.on('menu:open-directory', callback),
    onSave: (callback: () => void) => ipcRenderer.on('menu:save', callback),
    onSaveAs: (callback: () => void) => ipcRenderer.on('menu:save-as', callback),
    onUndo: (callback: () => void) => ipcRenderer.on('menu:undo', callback),
    onAbout: (callback: () => void) => ipcRenderer.on('menu:about', callback),
  },
};

try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
} catch (error) {
}

