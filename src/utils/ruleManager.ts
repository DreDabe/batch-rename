import type { RuleConfig } from '../stores/ruleStore'

export interface SavedRule {
  id: string
  name: string
  config: RuleConfig
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'batch-rename-saved-rules'

export class RuleManager {
  private rules: SavedRule[] = []

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        this.rules = JSON.parse(stored)
      }
    } catch {
      this.rules = []
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.rules))
    } catch {
      // Ignore storage errors
    }
  }

  getAll(): SavedRule[] {
    return [...this.rules]
  }

  getById(id: string): SavedRule | undefined {
    return this.rules.find((r) => r.id === id)
  }

  save(name: string, config: RuleConfig): SavedRule {
    const now = new Date().toISOString()
    const rule: SavedRule = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      name,
      config: { ...config },
      createdAt: now,
      updatedAt: now,
    }
    this.rules.push(rule)
    this.saveToStorage()
    return rule
  }

  update(id: string, config: Partial<RuleConfig>): SavedRule | undefined {
    const index = this.rules.findIndex((r) => r.id === id)
    if (index === -1) return undefined

    this.rules[index] = {
      ...this.rules[index],
      config: { ...this.rules[index].config, ...config },
      updatedAt: new Date().toISOString(),
    }
    this.saveToStorage()
    return this.rules[index]
  }

  delete(id: string): boolean {
    const index = this.rules.findIndex((r) => r.id === id)
    if (index === -1) return false

    this.rules.splice(index, 1)
    this.saveToStorage()
    return true
  }

  rename(id: string, name: string): SavedRule | undefined {
    const index = this.rules.findIndex((r) => r.id === id)
    if (index === -1) return undefined

    this.rules[index].name = name
    this.rules[index].updatedAt = new Date().toISOString()
    this.saveToStorage()
    return this.rules[index]
  }
}

export const ruleManager = new RuleManager()
