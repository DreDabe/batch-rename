const { contextBridge, ipcRenderer } = require('electron');

console.log('[preload.ts] preload 脚本开始加载');

const electronAPI = {
  fs: {
    readDirectory: (dirPath) => ipcRenderer.invoke('fs:readDirectory', dirPath),
    rename: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
    delete: (pathToDelete, recursive) => ipcRenderer.invoke('fs:delete', pathToDelete, recursive),
    createFolder: (parentPath, name) => ipcRenderer.invoke('fs:createFolder', parentPath, name),
    copy: (source, destination) => ipcRenderer.invoke('fs:copy', source, destination),
    move: (source, destination) => ipcRenderer.invoke('fs:move', source, destination),
    exists: (targetPath) => ipcRenderer.invoke('fs:exists', targetPath),
    readFile: (targetPath, maxSize) => ipcRenderer.invoke('fs:readFile', targetPath, maxSize),
    readImageBase64: (targetPath) => ipcRenderer.invoke('fs:readImageBase64', targetPath),
    getDrives: () => ipcRenderer.invoke('fs:getDrives'),
    hasChildren: (dirPath) => ipcRenderer.invoke('fs:hasChildren', dirPath),
  },

  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    showMessage: (options) => ipcRenderer.invoke('dialog:showMessage', options),
  },

  history: {
    undo: () => ipcRenderer.invoke('history:undo'),
    getHistory: () => ipcRenderer.invoke('history:getHistory'),
    canUndo: () => ipcRenderer.invoke('history:canUndo'),
    clear: () => ipcRenderer.invoke('history:clear'),
  },

  config: {
    load: () => ipcRenderer.invoke('config:load'),
    get: () => ipcRenderer.invoke('config:get'),
    update: (key, value) => ipcRenderer.invoke('config:update', key, value),
    addFavorite: (path) => ipcRenderer.invoke('config:addFavorite', path),
    removeFavorite: (path) => ipcRenderer.invoke('config:removeFavorite', path),
  },

  version: {
    checkUpdate: () => ipcRenderer.invoke('version:checkUpdate'),
    current: () => ipcRenderer.invoke('version:current'),
  },
};

console.log('[preload.ts] electronAPI 对象创建完成:', Object.keys(electronAPI));

try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  console.log('[preload.ts] electronAPI 已成功暴露到 window 对象');
} catch (error) {
  console.error('[preload.ts] 暴露 electronAPI 时出错:', error);
}

console.log('[preload.ts] preload 脚本加载完成');
