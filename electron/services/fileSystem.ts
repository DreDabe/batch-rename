import { app } from 'electron'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import os from 'os'
import type { FileItem, DirectoryInfo, OperationResult } from '../src/types'

export interface DriveInfo {
  name: string
  path: string
  type: 'fixed' | 'removable' | 'network' | 'cdrom' | 'unknown'
  size?: number
  freeSpace?: number
}

export class FileSystemService {
  async readDirectory(dirPath: string): Promise<OperationResult<DirectoryInfo>> {
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
          console.log(`[fileSystem] 跳过无法访问的文件: ${fullPath}`, statError instanceof Error ? statError.message : 'Unknown error')
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

  async createFolder(parentPath: string, name: string): Promise<OperationResult<string>> {
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
      const stats = await fs.stat(source)

      if (stats.isDirectory()) {
        await this.copyDirectory(source, destination)
      } else {
        await fs.copyFile(source, destination)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async move(source: string, destination: string): Promise<OperationResult> {
    try {
      await fs.rename(source, destination)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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

  async getStats(targetPath: string): Promise<OperationResult<fs.Stats>> {
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

  async readFile(targetPath: string, maxSize = 1024 * 1024): Promise<OperationResult<string>> {
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

  async readImageBase64(targetPath: string): Promise<OperationResult<string>> {
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

  async getDrives(): Promise<OperationResult<DriveInfo[]>> {
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
}

export const fileSystemService = new FileSystemService()
