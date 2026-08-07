import { create } from 'zustand'
import type { User } from '@/types'
import {
  getApiRegistry,
  getCurrentUser,
  login as loginApi,
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
    const { token, user } = res.data
    // 先写 localStorage / 权限，完成 registry 与 UI 偏好后再发布 token。
    // 否则 LoginGuard 会在 bootstrap 未完成时立刻 Navigate，触发 AuthGuard 竞态。
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    usePermissionStore.getState().setAuthData(user.roles || [], user.permissions || [])
    await get().loadRegistry()
    startSessionGuard()
    await useUiPreferenceStore.getState().load()
    set({ token, user })
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
