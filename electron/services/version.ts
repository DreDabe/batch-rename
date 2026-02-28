import { app } from 'electron'
import type { OperationResult } from '../../src/types'

interface GitHubRelease {
  tag_name: string
  name: string
  html_url: string
  body: string
  published_at: string
  assets: {
    name: string
    browser_download_url: string
    size: number
  }[]
}

interface VersionInfo {
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
  downloadUrl?: string
  releaseNotes?: string
  publishedAt?: string
}

export class VersionService {
  private readonly repoOwner = 'DreDabe'
  private readonly repoName = 'batch-rename'

  getCurrentVersion(): string {
    return app.getVersion()
  }

  async checkForUpdate(): Promise<OperationResult<VersionInfo>> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/releases/latest`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const release: GitHubRelease = await response.json()
      const currentVersion = this.getCurrentVersion()
      const latestVersion = release.tag_name.replace(/^v/, '')

      const hasUpdate = this.compareVersions(latestVersion, currentVersion) > 0

      const windowsAsset = release.assets.find(
        (a) => a.name.endsWith('.exe') || a.name.endsWith('.msi')
      )

      return {
        success: true,
        data: {
          currentVersion,
          latestVersion,
          hasUpdate,
          downloadUrl: windowsAsset?.browser_download_url,
          releaseNotes: release.body,
          publishedAt: release.published_at,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0
      const p2 = parts2[i] || 0

      if (p1 > p2) return 1
      if (p1 < p2) return -1
    }

    return 0
  }
}

export const versionService = new VersionService()
