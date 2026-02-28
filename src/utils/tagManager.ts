import type { Tag } from '../types/rules'

const STORAGE_KEY = 'batch-rename-tags'

const DEFAULT_TAGS: Tag[] = [
  { id: '1', name: '工作', color: '#3b82f6', value: 'Work' },
  { id: '2', name: '个人', color: '#10b981', value: 'Personal' },
  { id: '3', name: '重要', color: '#ef4444', value: 'Important' },
  { id: '4', name: '临时', color: '#f59e0b', value: 'Temp' },
]

export class TagManager {
  private tags: Tag[] = []

  constructor() {
    this.loadTags()
  }

  private loadTags(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        this.tags = JSON.parse(stored)
      } else {
        this.tags = [...DEFAULT_TAGS]
        this.saveTags()
      }
    } catch {
      this.tags = [...DEFAULT_TAGS]
    }
  }

  private saveTags(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tags))
    } catch {
      // Ignore storage errors
    }
  }

  getAll(): Tag[] {
    return [...this.tags]
  }

  getById(id: string): Tag | undefined {
    return this.tags.find((tag) => tag.id === id)
  }

  add(tag: Omit<Tag, 'id'>): Tag {
    const newTag: Tag = {
      ...tag,
      id: this.generateId(),
    }
    this.tags.push(newTag)
    this.saveTags()
    return newTag
  }

  update(id: string, updates: Partial<Omit<Tag, 'id'>>): Tag | undefined {
    const index = this.tags.findIndex((tag) => tag.id === id)
    if (index === -1) return undefined

    this.tags[index] = { ...this.tags[index], ...updates }
    this.saveTags()
    return this.tags[index]
  }

  delete(id: string): boolean {
    const index = this.tags.findIndex((tag) => tag.id === id)
    if (index === -1) return false

    this.tags.splice(index, 1)
    this.saveTags()
    return true
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  applyTagToPattern(pattern: string, tagValue: string): string {
    return pattern + tagValue
  }

  search(query: string): Tag[] {
    const lowerQuery = query.toLowerCase()
    return this.tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(lowerQuery) ||
        tag.value.toLowerCase().includes(lowerQuery)
    )
  }
}

export const tagManager = new TagManager()
