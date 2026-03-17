import { ipcMain, dialog, BrowserWindow } from 'electron'
import { fileSystemService } from '../services/fileSystem'
import { historyService } from '../services/history'
import { configService } from '../services/config'
import { logService } from '../services/logger'
import { versionService } from '../services/version'

export function registerIpcHandlers(): void {
  // Debug logging
  ipcMain.on('debug:log', (_event, message: string, data?: unknown) => {
    const timestamp = new Date().toISOString()
    if (data !== undefined) {
      console.log(`[${timestamp}] ${message}`, JSON.stringify(data, null, 2))
    } else {
      console.log(`[${timestamp}] ${message}`)
    }
  })

  // File System Operations
  ipcMain.handle('fs:readDirectory', async (_event, dirPath: string) => {
    return fileSystemService.readDirectory(dirPath)
  })

  ipcMain.handle('fs:rename', async (_event, oldPath: string, newPath: string) => {
    const result = await fileSystemService.rename(oldPath, newPath)

    if (result.success) {
      await historyService.recordOperation('rename', { oldPath, newPath }, {
        type: 'rename',
        originalPath: oldPath,
        newPath,
      })
      await logService.info('File renamed', { oldPath, newPath })
    }

    return result
  })

  ipcMain.handle('fs:delete', async (_event, pathToDelete: string, recursive = false) => {
    // 创建备份路径用于撤销
    const backupPath = `${pathToDelete}.backup${Date.now()}`
    try {
      // 复制文件/文件夹到备份位置
      const fs = require('fs/promises')
      const path = require('path')
      
      // 检查文件是否存在
      const stats = await fs.stat(pathToDelete)
      if (stats.isDirectory()) {
        await fs.cp(pathToDelete, backupPath, { recursive: true })
      } else {
        await fs.copyFile(pathToDelete, backupPath)
      }
    } catch (err) {
      console.error('创建备份失败:', err)
    }

    const result = await fileSystemService.delete(pathToDelete, recursive)

    if (result.success) {
      await historyService.recordOperation('delete', { path: pathToDelete, recursive }, {
        type: 'delete',
        originalPath: pathToDelete,
        backupPath: backupPath,
      })
      await logService.info('File deleted', { path: pathToDelete, recursive })
    }

    return result
  })

  ipcMain.handle('fs:createFolder', async (_event, parentPath: string, name: string) => {
    const result = await fileSystemService.createFolder(parentPath, name)

    if (result.success) {
      await historyService.recordOperation('createFolder', { parentPath, name }, {
        type: 'create',
        newPath: result.data,
      })
      await logService.info('Folder created', { parentPath, name })
    }

    return result
  })

  ipcMain.handle('fs:createFile', async (_event, parentPath: string, name: string, content: string) => {
    const result = await fileSystemService.createFile(parentPath, name, content)

    if (result.success) {
      await historyService.recordOperation('createFile', { parentPath, name }, {
        type: 'create',
        newPath: result.data,
      })
      await logService.info('File created', { parentPath, name })
    }

    return result
  })

  ipcMain.handle('fs:copy', async (_event, source: string, destination: string) => {
    const result = await fileSystemService.copy(source, destination)

    if (result.success) {
      // 为复制操作添加历史记录，撤销时删除复制的文件
      const fileName = source.substring(source.lastIndexOf('\\') + 1)
      const destFilePath = destination + '\\' + fileName
      
      await historyService.recordOperation('copy', { source, destination }, {
        type: 'create',
        newPath: destFilePath,
      })
      await logService.info('File copied', { source, destination })
    }

    return result
  })

  ipcMain.handle('fs:move', async (_event, source: string, destination: string) => {
    const result = await fileSystemService.move(source, destination)

    if (result.success) {
      await historyService.recordOperation('move', { source, destination }, {
        type: 'move',
        originalPath: source,
        newPath: destination,
      })
      await logService.info('File moved', { source, destination })
    }

    return result
  })

  ipcMain.handle('fs:exists', async (_event, targetPath: string) => {
    return fileSystemService.exists(targetPath)
  })

  ipcMain.handle('fs:readFile', async (_event, targetPath: string, maxSize?: number) => {
    return fileSystemService.readFile(targetPath, maxSize)
  })

  ipcMain.handle('fs:readImageBase64', async (_event, targetPath: string) => {
    return fileSystemService.readImageBase64(targetPath)
  })

  ipcMain.handle('fs:getDrives', async () => {
    return fileSystemService.getDrives()
  })

  ipcMain.handle('fs:hasChildren', async (_event, dirPath: string) => {
    return fileSystemService.hasChildren(dirPath)
  })

  // Dialog Operations
  ipcMain.handle('dialog:saveFile', async (_event, options: any) => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) {
      return { canceled: true, filePath: null }
    }

    const result = await dialog.showSaveDialog(window, options)
    return result
  })

  // Menu Events
  ipcMain.on('menu:new-file', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      // 通知渲染进程创建新文件
      event.sender.send('menu:new-file')
    }
  })

  ipcMain.on('menu:new-folder', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      // 通知渲染进程创建新文件夹
      event.sender.send('menu:new-folder')
    }
  })

  ipcMain.on('menu:open-file', async (event, path: string) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      // 通知渲染进程打开文件
      event.sender.send('menu:open-file', path)
    }
  })

  ipcMain.on('menu:open-directory', async (event, path: string) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      // 通知渲染进程打开目录
      event.sender.send('menu:open-directory', path)
    }
  })

  ipcMain.on('menu:save', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      // 通知渲染进程保存文件
      event.sender.send('menu:save')
    }
  })

  ipcMain.on('menu:save-as', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      // 通知渲染进程另存为文件
      event.sender.send('menu:save-as')
    }
  })

  ipcMain.on('menu:undo', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      // 通知渲染进程执行撤销操作
      event.sender.send('menu:undo')
    }
  })

  ipcMain.on('menu:about', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      // 通知渲染进程显示关于对话框
      event.sender.send('menu:about')
    }
  })

  // Dialog Operations
  ipcMain.handle('dialog:openDirectory', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(window!, {
      properties: ['openDirectory', 'createDirectory'],
      title: '选择目录',
    })

    if (!result.canceled && result.filePaths.length > 0) {
      await configService.addRecentPath(result.filePaths[0])
      return result.filePaths[0]
    }

    return null
  })

  ipcMain.handle('dialog:showMessage', async (event, options: {
    type: 'none' | 'info' | 'error' | 'question' | 'warning'
    title: string
    message: string
    buttons?: string[]
  }) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    return dialog.showMessageBox(window!, options)
  })

  // History Operations
  ipcMain.handle('history:undo', async () => {
    const result = await historyService.undo()
    if (result.success) {
      await logService.info('Operation undone')
    }
    return result
  })

  ipcMain.handle('history:getHistory', () => {
    return historyService.getHistory()
  })

  ipcMain.handle('history:canUndo', () => {
    return historyService.canUndo()
  })

  ipcMain.handle('history:clear', () => {
    historyService.clearHistory()
    return { success: true }
  })

  ipcMain.handle('history:recordOperation', async (_event, operation: string, params: any, rollbackInfo: any) => {
    return historyService.recordOperation(operation, params, rollbackInfo)
  })

  // Config Operations
  ipcMain.handle('config:load', async () => {
    return configService.load()
  })

  ipcMain.handle('config:get', () => {
    return configService.get()
  })

  ipcMain.handle('config:update', async (_event, key: string, value: string | string[] | undefined) => {
    return configService.update(key as keyof ReturnType<typeof configService.get>, value)
  })

  ipcMain.handle('config:addFavorite', async (_event, path: string) => {
    return configService.addFavorite(path)
  })

  ipcMain.handle('config:removeFavorite', async (_event, path: string) => {
    return configService.removeFavorite(path)
  })

  ipcMain.handle('config:setConfig', async (_event, config: any) => {
    return configService.setConfig(config)
  })

  // Version Operations
  ipcMain.handle('version:checkUpdate', async () => {
    return versionService.checkForUpdate()
  })

  ipcMain.handle('version:current', () => {
    return versionService.getCurrentVersion()
  })
}
