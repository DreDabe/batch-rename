import { ipcMain, dialog, BrowserWindow } from 'electron'
import { fileSystemService } from '../services/fileSystem'
import { historyService } from '../services/history'
import { configService } from '../services/config'
import { logService } from '../services/logger'
import { versionService } from '../services/version'

export function registerIpcHandlers(): void {
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
    const result = await fileSystemService.delete(pathToDelete, recursive)

    if (result.success) {
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

  ipcMain.handle('fs:copy', async (_event, source: string, destination: string) => {
    const result = await fileSystemService.copy(source, destination)

    if (result.success) {
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

  // Config Operations
  ipcMain.handle('config:load', async () => {
    return configService.load()
  })

  ipcMain.handle('config:get', () => {
    return configService.get()
  })

  ipcMain.handle('config:update', async (_event, key: string, value: unknown) => {
    return configService.update(key as keyof ReturnType<typeof configService.get>, value)
  })

  ipcMain.handle('config:addFavorite', async (_event, path: string) => {
    return configService.addFavorite(path)
  })

  ipcMain.handle('config:removeFavorite', async (_event, path: string) => {
    return configService.removeFavorite(path)
  })

  // Version Operations
  ipcMain.handle('version:checkUpdate', async () => {
    return versionService.checkForUpdate()
  })

  ipcMain.handle('version:current', () => {
    return versionService.getCurrentVersion()
  })
}
