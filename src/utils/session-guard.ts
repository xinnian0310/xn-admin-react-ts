/**
 * 会话守卫：空闲超时登出 + 滑动续期
 */
import { message } from 'antd'
import { appConfig } from '@/config/app'
import { navigateTo } from '@/utils/history'

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'wheel',
] as const

let started = false
let lastActivityAt = 0
let lastRefreshAt = 0
let idleCheckTimer: ReturnType<typeof setInterval> | null = null
let activityThrottleTimer: ReturnType<typeof setTimeout> | null = null
let refreshing = false
let loggingOut = false

function sessionCfg() {
  return appConfig.session
}

function markActivity() {
  lastActivityAt = Date.now()
}

async function doRefresh() {
  const cfg = sessionCfg()
  if (!cfg.slidingRefreshEnabled || !localStorage.getItem('token')) return
  const now = Date.now()
  if (now - lastRefreshAt < cfg.refreshIntervalMs) return
  if (refreshing) return

  refreshing = true
  try {
    const { useUserStore } = await import('@/stores/user')
    await useUserStore.getState().refreshToken()
    lastRefreshAt = Date.now()
  } catch (error) {
    console.warn('[session-guard] token 续期失败', error)
  } finally {
    refreshing = false
  }
}

async function doIdleLogout() {
  if (loggingOut || !localStorage.getItem('token')) return
  loggingOut = true
  try {
    const { useUserStore } = await import('@/stores/user')
    await useUserStore.getState().logout()
    message.warning('长时间未操作，已自动退出登录')
    if (window.location.pathname !== '/login') {
      navigateTo('/login', { replace: true })
    }
  } finally {
    loggingOut = false
  }
}

function checkIdle() {
  const cfg = sessionCfg()
  if (!cfg.idleLogoutEnabled || !localStorage.getItem('token')) return
  if (Date.now() - lastActivityAt >= cfg.idleTimeoutMs) {
    void doIdleLogout()
  }
}

function onActivity() {
  if (!localStorage.getItem('token')) return
  if (activityThrottleTimer) return
  activityThrottleTimer = setTimeout(() => {
    activityThrottleTimer = null
  }, 1000)

  markActivity()
  void doRefresh()
}

function onVisibilityChange() {
  if (document.visibilityState !== 'visible') return
  if (!localStorage.getItem('token')) return
  checkIdle()
  if (!loggingOut && localStorage.getItem('token')) {
    markActivity()
    void doRefresh()
  }
}

/** 登录成功或已有 token 时启动 */
export function startSessionGuard() {
  if (!localStorage.getItem('token')) return

  markActivity()
  lastRefreshAt = Date.now()

  if (!started) {
    started = true
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true })
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  const cfg = sessionCfg()
  if (idleCheckTimer) {
    clearInterval(idleCheckTimer)
    idleCheckTimer = null
  }
  if (cfg.idleLogoutEnabled) {
    idleCheckTimer = setInterval(checkIdle, cfg.idleCheckIntervalMs)
  }
}

/** 退出登录时停止 */
export function stopSessionGuard() {
  if (idleCheckTimer) {
    clearInterval(idleCheckTimer)
    idleCheckTimer = null
  }
  if (activityThrottleTimer) {
    clearTimeout(activityThrottleTimer)
    activityThrottleTimer = null
  }
  if (started) {
    for (const event of ACTIVITY_EVENTS) {
      window.removeEventListener(event, onActivity)
    }
    document.removeEventListener('visibilitychange', onVisibilityChange)
    started = false
  }
  refreshing = false
  loggingOut = false
  lastActivityAt = 0
  lastRefreshAt = 0
}
