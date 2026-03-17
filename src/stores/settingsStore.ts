import { create } from 'zustand'
import type { AppConfig } from '../types'
import { DEFAULT_CONFIG } from '../types'

interface SettingsState {
  settings: AppConfig
  isLoading: boolean
  hasLoaded: boolean
  
  loadSettings: () => Promise<void>
  updateSettings: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => Promise<void>
  setSettings: (settings: AppConfig) => Promise<void>
  resetSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: { ...DEFAULT_CONFIG },
  isLoading: false,
  hasLoaded: false,
  
  loadSettings: async () => {
    set({ isLoading: true })
    try {
      const result = await window.electronAPI.config.load()
      if (result.success && result.data) {
        const loadedData = result.data as AppConfig
        set({ settings: loadedData, hasLoaded: true })
      } else {
        set({ hasLoaded: true })
      }
    } catch (error) {
      set({ hasLoaded: true })
    } finally {
      set({ isLoading: false })
    }
  },
  
  updateSettings: async <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
    let newSettings;
    set((state) => {
      const oldSettings = state.settings
      newSettings = { ...oldSettings, [key]: value }
      return { settings: newSettings }
    })
    
    try {
      await window.electronAPI.config.setConfig(newSettings!)
    } catch (error) {
    }
  },
  
  setSettings: async (settings: AppConfig) => {
    set({ settings })
    try {
      await window.electronAPI.config.setConfig(settings)
    } catch (error) {
    }
  },
  
  resetSettings: async () => {
    set({ settings: { ...DEFAULT_CONFIG } })
    try {
      await window.electronAPI.config.setConfig(DEFAULT_CONFIG)
    } catch (error) {
    }
  },
}))
