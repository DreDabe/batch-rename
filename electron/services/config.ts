import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import type { AppConfig, OperationResult } from '../../src/types'
import { DEFAULT_CONFIG } from '../../src/types'

export class ConfigService {
  private config: AppConfig
  private configPath: string

  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'config.json')
    this.config = { ...DEFAULT_CONFIG }
  }

  async load(): Promise<OperationResult> {
    try {
      const exists = await this.configExists()

      if (exists) {
        const data = await fs.readFile(this.configPath, 'utf-8')
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(data) }
      } else {
        await this.save()
      }

      return { success: true, data: this.config }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: this.config,
      }
    }
  }

  async save(): Promise<OperationResult> {
    try {
      const configDir = path.dirname(this.configPath)
      await fs.mkdir(configDir, { recursive: true })
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8')
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  get(): AppConfig {
    return { ...this.config }
  }

  async update<K extends keyof AppConfig>(key: K, value: AppConfig[K]): Promise<OperationResult> {
    this.config[key] = value
    return this.save()
  }

  async setConfig(newConfig: Partial<AppConfig>): Promise<OperationResult> {
    this.config = { ...this.config, ...newConfig }
    return this.save()
  }

  private async configExists(): Promise<boolean> {
    try {
      await fs.access(this.configPath)
      return true
    } catch {
      return false
    }
  }

  async addFavorite(favoritePath: string): Promise<OperationResult> {
    if (!this.config.favorites.includes(favoritePath)) {
      this.config.favorites.push(favoritePath)
      return this.save()
    }
    return { success: true }
  }

  async removeFavorite(favoritePath: string): Promise<OperationResult> {
    this.config.favorites = this.config.favorites.filter((f) => f !== favoritePath)
    return this.save()
  }

  async addRecentPath(recentPath: string): Promise<OperationResult> {
    this.config.recentPaths = this.config.recentPaths.filter((p) => p !== recentPath)
    this.config.recentPaths.unshift(recentPath)

    if (this.config.recentPaths.length > 10) {
      this.config.recentPaths = this.config.recentPaths.slice(0, 10)
    }

    return this.save()
  }
}

export const configService = new ConfigService()
