const electronAPI = {
  fs: {
    readDirectory: async () => ({ success: true, data: { files: [], path: '' } }),
    rename: async () => ({ success: true }),
    delete: async () => ({ success: true }),
    createFolder: async () => ({ success: true }),
    copy: async () => ({ success: true }),
    move: async () => ({ success: true }),
    exists: async () => true,
    readFile: async () => ({ success: true, data: '' }),
    readImageBase64: async () => ({ success: true, data: '' }),
  },
  dialog: {
    openDirectory: async () => null,
    showMessage: async () => ({ response: 0, checkboxChecked: false }),
  },
  history: {
    undo: async () => ({ success: true }),
    getHistory: async () => [],
    canUndo: async () => false,
    clear: async () => ({ success: true }),
  },
  config: {
    load: async () => ({ success: true, data: {} }),
    get: async () => ({ favorites: [], recentPaths: [] }),
    update: async () => ({ success: true }),
    addFavorite: async () => ({ success: true }),
    removeFavorite: async () => ({ success: true }),
  },
  version: {
    checkUpdate: async () => ({ success: true, data: { currentVersion: '1.0.0', latestVersion: '1.0.0', hasUpdate: false } }),
    current: async () => '1.0.0',
  },
}

Object.defineProperty(window, 'electronAPI', {
  writable: true,
  value: electronAPI,
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})
