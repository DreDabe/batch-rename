import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import type { FileItem, DirectoryInfo, OperationResult } from '../../src/types'
import type { Stats } from 'fs'

export interface DriveInfo {
  name: string
  path: string
  type: 'fixed' | 'removable' | 'network' | 'cdrom' | 'unknown'
  size?: number
  freeSpace?: number
}

export class FileSystemService {
  async readDirectory(dirPath: string): Promise<OperationResult> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      const files: FileItem[] = []

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        try {
          const stats = await fs.stat(fullPath)

          files.push({
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            isFile: entry.isFile(),
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            extension: entry.isFile() ? path.extname(entry.name).toLowerCase() : '',
          })
        } catch (statError) {
          // 跳过无法访问的文件
        }
      }

      return {
        success: true,
        data: {
          path: dirPath,
          files,
          totalCount: files.length,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async rename(oldPath: string, newPath: string): Promise<OperationResult> {
    try {
      await fs.rename(oldPath, newPath)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async delete(pathToDelete: string, recursive = false): Promise<OperationResult> {
    try {
      const stats = await fs.stat(pathToDelete)

      if (stats.isDirectory()) {
        await fs.rm(pathToDelete, { recursive, force: true })
      } else {
        await fs.unlink(pathToDelete)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async createFolder(parentPath: string, name: string): Promise<OperationResult> {
    try {
      const newPath = path.join(parentPath, name)
      await fs.mkdir(newPath, { recursive: false })
      return { success: true, data: newPath }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async copy(source: string, destination: string): Promise<OperationResult> {
    try {
      const sourceStats = await fs.stat(source)
      
      // 检查目标是否存在
      let destStats
      try {
        destStats = await fs.stat(destination)
      } catch (statError) {
        // 目标不存在，假设它是一个目录并创建
        try {
          await fs.mkdir(destination, { recursive: true })
          destStats = { isDirectory: () => true } as Stats
        } catch (mkdirError) {
          return {
            success: false,
            error: `创建目录失败: ${mkdirError instanceof Error ? mkdirError.message : '未知错误'}`,
          }
        }
      }

      if (destStats.isDirectory()) {
        // 如果目标是目录，构建完整的目标文件路径
        const fileName = path.basename(source)
        const destFilePath = path.join(destination, fileName)
        
        // 检查目标文件是否存在
        try {
          const destFileStats = await fs.stat(destFilePath)
          // 目标文件已存在，尝试覆盖
          if (sourceStats.isDirectory()) {
            // 如果是目录，先删除目标目录
            await fs.rm(destFilePath, { recursive: true, force: true })
            await this.copyDirectory(source, destFilePath)
          } else {
            // 如果是文件，直接覆盖
            await fs.copyFile(source, destFilePath)
          }
        } catch (statError) {
          // 目标文件不存在，直接复制
          if (sourceStats.isDirectory()) {
            await this.copyDirectory(source, destFilePath)
          } else {
            await fs.copyFile(source, destFilePath)
          }
        }
      } else {
        // 如果目标是文件，直接复制
        if (sourceStats.isDirectory()) {
          await this.copyDirectory(source, destination)
        } else {
          await fs.copyFile(source, destination)
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      }
    }
  }

  async move(source: string, destination: string): Promise<OperationResult> {
    try {
      // 检查目标是否存在
      let destStats
      try {
        destStats = await fs.stat(destination)
      } catch (statError) {
        // 目标不存在，假设它是一个目录并创建
        try {
          await fs.mkdir(destination, { recursive: true })
          destStats = { isDirectory: () => true } as Stats
        } catch (mkdirError) {
          return {
            success: false,
            error: `创建目录失败: ${mkdirError instanceof Error ? mkdirError.message : '未知错误'}`,
          }
        }
      }
      
      if (destStats.isDirectory()) {
        // 如果目标是目录，构建完整的目标文件路径
        const fileName = path.basename(source)
        const destFilePath = path.join(destination, fileName)
        
        // 检查目标文件是否存在
        try {
          const destFileStats = await fs.stat(destFilePath)
          // 目标文件已存在，尝试覆盖
          await fs.rm(destFilePath, { recursive: true, force: true })
          await fs.rename(source, destFilePath)
        } catch (statError) {
          // 目标文件不存在，直接移动
          await fs.rename(source, destFilePath)
        }
      } else {
        // 如果目标是文件，直接重命名
        await fs.rename(source, destination)
      }
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      }
    }
  }

  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true })
    const entries = await fs.readdir(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath)
      } else {
        await fs.copyFile(srcPath, destPath)
      }
    }
  }

  async exists(targetPath: string): Promise<boolean> {
    try {
      await fs.access(targetPath)
      return true
    } catch {
      return false
    }
  }

  async getStats(targetPath: string): Promise<OperationResult> {
    try {
      const stats = await fs.stat(targetPath)
      return { success: true, data: stats }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async readFile(targetPath: string, maxSize = 1024 * 1024): Promise<OperationResult> {
    try {
      const stats = await fs.stat(targetPath)
      if (stats.size > maxSize) {
        return {
          success: false,
          error: `文件过大 (${Math.round(stats.size / 1024)}KB)，超过预览限制`,
        }
      }
      const content = await fs.readFile(targetPath, 'utf-8')
      return { success: true, data: content }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async readImageBase64(targetPath: string): Promise<OperationResult> {
    try {
      const buffer = await fs.readFile(targetPath)
      const ext = path.extname(targetPath).toLowerCase()
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
        '.svg': 'image/svg+xml',
      }
      const mimeType = mimeTypes[ext] || 'application/octet-stream'
      const base64 = buffer.toString('base64')
      return { success: true, data: `data:${mimeType};base64,${base64}` }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  getAppPath(): string {
    return app.getPath('userData')
  }

  async getDrives(): Promise<OperationResult> {
    try {
      const drives: DriveInfo[] = []
      const platform = os.platform()

      if (platform === 'win32') {
        const commonDrives = ['C:', 'D:', 'E:']
        
        for (const driveLetter of commonDrives) {
          const drivePath = driveLetter + '\\'
          try {
            await fs.access(drivePath)
            drives.push({
              name: driveLetter,
              path: drivePath,
              type: 'fixed',
            })
          } catch {
          }
        }

        if (drives.length === 0) {
          drives.push({
            name: 'C:',
            path: 'C:\\',
            type: 'fixed',
          })
        }
      } else {
        drives.push({
          name: 'Root',
          path: '/',
          type: 'fixed',
        })
      }

      return { success: true, data: drives }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async hasChildren(dirPath: string): Promise<boolean> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      return entries.some(entry => entry.isDirectory())
    } catch {
      return false
    }
  }

  async createFile(parentPath: string, name: string, content: string): Promise<OperationResult> {
    try {
      const newPath = path.join(parentPath, name)
      await fs.writeFile(newPath, content, 'utf-8')
      return { success: true, data: newPath }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

export const fileSystemService = new FileSystemService()
