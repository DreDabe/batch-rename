import { app, BrowserWindow, Menu, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { registerIpcHandlers } from './ipc/index'
import { configService } from './services/config'
import { logService } from './services/logger'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

async function initialize() {
  await logService.initialize()
  await configService.load()
  registerIpcHandlers()
}

function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建文件夹',
          accelerator: 'Ctrl+Shift+N',
          click: (_, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send('menu:new-folder')
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: '打开目录',
          accelerator: 'Ctrl+K',
          click: async (_, focusedWindow) => {
            if (focusedWindow) {
              const result = await dialog.showOpenDialog(focusedWindow, {
                properties: ['openDirectory', 'createDirectory'],
                title: '选择目录'
              })
              if (!result.canceled && result.filePaths.length > 0) {
                focusedWindow.webContents.send('menu:open-directory', result.filePaths[0])
              }
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: '保存',
          accelerator: 'Ctrl+S',
          click: (_, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send('menu:save')
            }
          }
        },
        {
          label: '另存为',
          accelerator: 'Ctrl+Shift+S',
          click: (_, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send('menu:save-as')
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: '关闭窗口',
          accelerator: 'Ctrl+W',
          click: (_, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.close()
            }
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        {
          label: '撤销',
          accelerator: 'Ctrl+Z',
          click: (_, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send('menu:undo')
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: '复制',
          accelerator: 'Ctrl+C',
          role: 'copy'
        },
        {
          label: '剪切',
          accelerator: 'Ctrl+X',
          role: 'cut'
        },
        {
          label: '粘贴',
          accelerator: 'Ctrl+V',
          role: 'paste'
        },
        {
          type: 'separator'
        },
        {
          label: '全选',
          accelerator: 'Ctrl+A',
          role: 'selectAll'
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: (_, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send('menu:about')
            }
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
    title: '批量重命名工具',
    show: false,
  })

  // 创建菜单
  createMenu()

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html')
    mainWindow.loadFile(indexPath)
  }
}

app.whenReady().then(async () => {
  await initialize()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
