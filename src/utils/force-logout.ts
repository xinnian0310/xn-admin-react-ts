/**
 * 登录态失效的统一收口。
 *
 * 三个入口共用：WebSocket 收到 auth:force-logout、WebSocket 被服务端以 4401 关闭、HTTP 401。
 * 通过单飞标记保证并发场景下只清一次会话、只弹一次窗。
 */
import { Modal } from 'antd'
import { navigateTo } from '@/utils/history'

/** 与后端 NoticeSessionHub.KICKED_STATUS 约定的关闭码 */
export const FORCE_LOGOUT_CLOSE_CODE = 4401
/** 与后端约定的强制下线消息类型 */
export const FORCE_LOGOUT_MESSAGE_TYPE = 'auth:force-logout'

const DEFAULT_MESSAGE = '您的登录状态已失效，请重新登录'

let handling = false

export function handleForceLogout(message?: string) {
  if (handling) return
  // 登录页本身不需要再弹窗打断
  if (window.location.pathname.endsWith('/login')) return
  handling = true

  const content = message?.trim() || DEFAULT_MESSAGE

  void (async () => {
    try {
      const { useUserStore } = await import('@/stores/user')
      await useUserStore.getState().logout(false)
    } catch {
      // 本地态清理失败也必须继续跳转登录页
    }

    // 点确认或点右上角关闭都回到登录页
    const redirect = () => {
      handling = false
      navigateTo('/login', { replace: true })
    }
    Modal.warning({
      title: '下线通知',
      content,
      okText: '重新登录',
      closable: true,
      mask: { closable: false },
      onOk: redirect,
      onCancel: redirect,
    })
  })()
}
