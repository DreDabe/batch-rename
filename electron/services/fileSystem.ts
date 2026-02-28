import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import type { FileItem, DirectoryInfo, OperationResult } from '../src/types'

export class FileSystemService {
  async readDirectory(dirPath: string): Promise<OperationResult<DirectoryInfo>> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      const files: FileItem[] = []

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
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

  getAppPath(): string {
    return app.getPath('userData')
  }
}

export const fileSystemService = new FileSystemService()
