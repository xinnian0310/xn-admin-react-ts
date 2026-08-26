import { create } from 'zustand'
import type { User } from '@/types'
import {
  getApiRegistry,
  getCurrentUser,
  login as loginApi,
  loginBySms as loginBySmsApi,
  logout as logoutApi,
  refreshToken as refreshTokenApi,
  updateCurrentUser,
  type ProfileUpdatePayload,
} from '@/api/auth'
import { usePermissionStore } from '@/stores/permission'
import { useTagsViewStore } from '@/stores/tagsView'
import { resetDynamicRoutes } from '@/utils/route-register'
import { clearApiRegistry, setApiRegistry } from '@/utils/api-guard'
import { normalizeDateTimes } from '@/utils/datetime'
import { useNoticeStore } from '@/stores/notice'
import { startSessionGuard, stopSessionGuard } from '@/utils/session-guard'
import { useUiPreferenceStore } from '@/stores/uiPreference'

interface UserState {
  token: string
  user: User | null
  login: (
    username: string,
    password: string,
    captcha?: { captchaId?: string; captchaCode?: string },
  ) => Promise<{ token: string; user: User }>
  loginBySms: (phone: string, code: string) => Promise<{ token: string; user: User }>
  refreshToken: () => Promise<{ token: string; user?: User }>
  fetchProfile: () => Promise<User>
  updateProfile: (payload: ProfileUpdatePayload) => Promise<User>
  loadRegistry: () => Promise<void>
  logout: (remote?: boolean) => Promise<void>
  clearAuth: () => void
}

function getStoredUser(): User | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    const parsed = normalizeDateTimes(JSON.parse(raw) as User)
    if (parsed.roles && parsed.permissions) {
      usePermissionStore.getState().setAuthData(parsed.roles, parsed.permissions)
    }
    return parsed
  } catch {
    return null
  }
}

export const useUserStore = create<UserState>((set, get) => ({
  token: localStorage.getItem('token') || '',
  user: getStoredUser(),

  clearAuth() {
    set({ token: '', user: null })
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    usePermissionStore.getState().clear()
    clearApiRegistry()
  },

  async loadRegistry() {
    try {
      const res = await getApiRegistry()
      setApiRegistry(res.data)
    } catch (error) {
      console.warn('[api-guard] 加载权限内容注册表失败', error)
    }
  },

  async login(username, password, captcha) {
    useTagsViewStore.getState().resetViews()
    resetDynamicRoutes()
    const res = await loginApi({
      username,
      password,
      captchaId: captcha?.captchaId,
      captchaCode: captcha?.captchaCode,
    })
    const token = res.data?.token
    const user = res.data?.user
    if (!token || !user) {
      throw new Error('登录响应无效')
    }
    // 与 Vue 一致：接口成功后立刻发布登录态，避免 bootstrap 失败时卡在登录页
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    usePermissionStore.getState().setAuthData(user.roles || [], user.permissions || [])
    set({ token, user })
    try {
      await get().loadRegistry()
      startSessionGuard()
      await useUiPreferenceStore.getState().load()
    } catch (error) {
      console.warn('[auth] 登录后初始化失败，已保留登录态', error)
    }
    return res.data
  },

  async loginBySms(phone, code) {
    useTagsViewStore.getState().resetViews()
    resetDynamicRoutes()
    const res = await loginBySmsApi({ phone, code })
    const token = res.data?.token
    const user = res.data?.user
    if (!token || !user) {
      throw new Error('登录响应无效')
    }
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    usePermissionStore.getState().setAuthData(user.roles || [], user.permissions || [])
    set({ token, user })
    try {
      await get().loadRegistry()
      startSessionGuard()
      await useUiPreferenceStore.getState().load()
    } catch (error) {
      console.warn('[auth] 登录后初始化失败，已保留登录态', error)
    }
    return res.data
  },

  async refreshToken() {
    const res = await refreshTokenApi()
    const token = res.data.token
    set({ token })
    localStorage.setItem('token', token)
    if (res.data.user) {
      set({ user: res.data.user })
      localStorage.setItem('user', JSON.stringify(res.data.user))
      usePermissionStore
        .getState()
        .setAuthData(res.data.user.roles || [], res.data.user.permissions || [])
    }
    return res.data
  },

  async fetchProfile() {
    const res = await getCurrentUser()
    set({ user: res.data })
    localStorage.setItem('user', JSON.stringify(res.data))
    usePermissionStore.getState().setAuthData(res.data.roles || [], res.data.permissions || [])
    return res.data
  },

  async updateProfile(payload) {
    const res = await updateCurrentUser(payload)
    set({ user: res.data })
    localStorage.setItem('user', JSON.stringify(res.data))
    usePermissionStore.getState().setAuthData(res.data.roles || [], res.data.permissions || [])
    return res.data
  },

  async logout(remote = true) {
    const currentToken = get().token
    stopSessionGuard()
    useNoticeStore.getState().stopRealtime()
    useTagsViewStore.getState().resetViews()
    useUiPreferenceStore.getState().clearLocal()
    get().clearAuth()
    resetDynamicRoutes()

    if (remote && currentToken) {
      try {
        await logoutApi(currentToken)
      } catch {
        /* ignore */
      }
    }
  },
}))
