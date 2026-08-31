import { create } from 'zustand'
import {
  getUserUiConfig,
  resetUserUiConfig,
  saveUserUiConfig,
  type UserUiConfig,
} from '@/api/user-ui-config'
import { applyUserUiPreference, type UserUiPreference } from '@/config/app'

interface UiPreferenceState {
  preference: UserUiConfig | null
  drawerVisible: boolean
  loaded: boolean
  openDrawer: () => void
  closeDrawer: () => void
  load: () => Promise<void>
  save: (data: UserUiConfig) => Promise<UserUiConfig>
  reset: () => Promise<void>
  restoreDefaults: () => Promise<void>
  clearLocal: () => void
}

export const useUiPreferenceStore = create<UiPreferenceState>((set) => ({
  preference: null,
  drawerVisible: false,
  loaded: false,

  openDrawer() {
    set({ drawerVisible: true })
  },

  closeDrawer() {
    set({ drawerVisible: false })
  },

  async load() {
    try {
      const res = await getUserUiConfig()
      set({ preference: res.data ?? null })
      applyUserUiPreference(res.data as UserUiPreference | null)
    } catch {
      set({ preference: null })
    } finally {
      set({ loaded: true })
    }
  },

  async save(data) {
    const res = await saveUserUiConfig(data)
    set({ preference: res.data })
    applyUserUiPreference(res.data as UserUiPreference)
    return res.data
  },

  async reset() {
    await resetUserUiConfig()
    set({ preference: null })
    applyUserUiPreference(null)
  },

  async restoreDefaults() {
    set({ preference: null, loaded: true })
    applyUserUiPreference(null)
    try {
      await resetUserUiConfig()
    } catch {
      /* 本机已恢复默认，云端清偏好失败不影响展示 */
    }
  },

  clearLocal() {
    set({ preference: null, loaded: false })
    applyUserUiPreference(null)
  },
}))
