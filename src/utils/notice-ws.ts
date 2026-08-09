import { useUserStore } from '@/stores/user'

type NoticeWsHandler = (data: Record<string, unknown>) => void

let socket: WebSocket | null = null
let heartbeatTimer: number | undefined
let reconnectTimer: number | undefined
let manualClose = false
const handlers = new Set<NoticeWsHandler>()

function buildWsUrl(token: string) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  return `${protocol}//${host}/ws/notices?token=${encodeURIComponent(token)}`
}

function clearTimers() {
  if (heartbeatTimer) {
    window.clearInterval(heartbeatTimer)
    heartbeatTimer = undefined
  }
  if (reconnectTimer) {
    window.clearTimeout(reconnectTimer)
    reconnectTimer = undefined
  }
}

function startHeartbeat() {
  heartbeatTimer = window.setInterval(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ping' }))
    }
  }, 25000)
}

function scheduleReconnect() {
  if (manualClose) return
  reconnectTimer = window.setTimeout(() => {
    connectNoticeWs()
  }, 3000)
}

function detachSocket(s: WebSocket) {
  s.onopen = null
  s.onmessage = null
  s.onerror = null
  s.onclose = null
}

/** 避免在 CONNECTING 时 close，否则浏览器会打 “closed before the connection is established” */
function safeClose(s: WebSocket) {
  if (s.readyState === WebSocket.OPEN) {
    s.close()
    return
  }
  if (s.readyState === WebSocket.CONNECTING) {
    s.addEventListener('open', () => {
      try {
        s.close()
      } catch {
        /* ignore */
      }
    })
  }
}

export function onNoticeWsMessage(handler: NoticeWsHandler) {
  handlers.add(handler)
  return () => handlers.delete(handler)
}

export function connectNoticeWs() {
  const token = useUserStore.getState().token || localStorage.getItem('token') || ''
  if (!token) return

  manualClose = false
  clearTimers()
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
  ) {
    return
  }

  const next = new WebSocket(buildWsUrl(token))
  socket = next

  next.onopen = () => {
    if (socket !== next) return
    startHeartbeat()
  }

  next.onmessage = (event) => {
    if (socket !== next) return
    try {
      const data = JSON.parse(String(event.data)) as Record<string, unknown>
      handlers.forEach((handler) => handler(data))
    } catch {
      /* ignore */
    }
  }

  next.onclose = () => {
    if (socket === next) {
      socket = null
      clearTimers()
      scheduleReconnect()
    }
  }

  // 失败会走 onclose；CONNECTING 时再 close 会触发控制台警告
  next.onerror = () => {
    /* no-op */
  }
}

export function disconnectNoticeWs() {
  manualClose = true
  clearTimers()
  if (!socket) return
  const s = socket
  socket = null
  detachSocket(s)
  safeClose(s)
}
