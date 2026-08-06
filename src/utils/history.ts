import type { NavigateFunction } from 'react-router-dom'

/**
 * 可变 navigate 引用：由 Router 内组件注入，供 axios / session-guard 等非组件层跳转。
 */
let navigateRef: NavigateFunction | null = null

export function setNavigate(navigate: NavigateFunction) {
  navigateRef = navigate
}

export function navigateTo(to: string, options?: { replace?: boolean }) {
  if (navigateRef) {
    navigateRef(to, options)
    return
  }
  if (options?.replace) {
    window.location.replace(to)
  } else {
    window.location.assign(to)
  }
}
