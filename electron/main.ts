import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { registerIpcHandlers } from './ipc/index'
import { configService } from './services/config'
import { logService } from './services/logger'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('[main.ts] 主进程启动')
console.log('[main.ts] __dirname:', __dirname)
console.log('[main.ts] preload 路径:', path.join(__dirname, 'preload.js'))

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
console.log('[main.ts] VITE_DEV_SERVER_URL:', VITE_DEV_SERVER_URL)

async function initialize() {
  console.log('[main.ts] initialize() 开始')
  await logService.initialize()
  await configService.load()
  registerIpcHandlers()
  console.log('[main.ts] initialize() 完成')
}

function createWindow() {
  console.log('[main.ts] createWindow() 开始')
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

  console.log('[main.ts] BrowserWindow 创建成功')

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[main.ts] 页面加载完成')
  })

  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('[main.ts] preload 加载错误:', preloadPath, error)
  })

  mainWindow.once('ready-to-show', () => {
    console.log('[main.ts] 窗口准备显示')
    mainWindow.show()
  })

  if (VITE_DEV_SERVER_URL) {
    console.log('[main.ts] 加载开发服务器 URL:', VITE_DEV_SERVER_URL)
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('[main.ts] 加载生产文件:', indexPath)
    mainWindow.loadFile(indexPath)
  }
}

app.whenReady().then(async () => {
  console.log('[main.ts] app 准备就绪')
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
