import type { ChatHandlers, ChatPayload } from '@/types/ai/conversation'
import { aiErrorText } from '@/utils/ai-errors'

function parseSseData(raw: string): Record<string, unknown> | null {
  const text = raw.trim()
  if (!text) return null
  try {
    const parsed = JSON.parse(text) as unknown
    if (typeof parsed === 'string') {
      return JSON.parse(parsed) as Record<string, unknown>
    }
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>
    }
  } catch {
    return null
  }
  return null
}

export async function streamChat(
  payload: ChatPayload,
  handlers: ChatHandlers,
  signal?: AbortSignal,
) {
  const token = localStorage.getItem('token')
  const res = await fetch('/api/ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  })

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('text/event-stream')) {
    let message = '发送失败'
    try {
      const json = (await res.json()) as { message?: string; errorCode?: string }
      message = aiErrorText(json.errorCode, json.message || message)
      handlers.onError?.(json.errorCode || 'ERROR', message)
    } catch {
      handlers.onError?.('ERROR', message)
    }
    throw new Error(message)
  }

  if (!res.body) {
    throw new Error('流式响应为空')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    buffer = buffer.replace(/\r\n/g, '\n')
    let idx = buffer.indexOf('\n\n')
    while (idx >= 0) {
      const chunk = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data:')) continue
        const data = parseSseData(line.slice(5))
        if (!data) continue
        const type = String(data.type || '')
        if (type === 'meta') {
          handlers.onMeta?.({
            streamId: String(data.streamId || ''),
            userMessageId: data.userMessageId ? String(data.userMessageId) : null,
            assistantMessageId: String(data.assistantMessageId || ''),
            modelSnapshot: String(data.modelSnapshot || ''),
            providerIcon: data.providerIcon ? String(data.providerIcon) : null,
            conversationTitle: data.conversationTitle ? String(data.conversationTitle) : null,
          })
        } else if (type === 'delta') {
          handlers.onDelta?.(String(data.content || ''))
        } else if (type === 'thinking') {
          handlers.onThinking?.(String(data.content || ''))
        } else if (type === 'done') {
          handlers.onDone?.({
            finishReason: String(data.finishReason || 'stop'),
            usage: (data.usage as Record<string, unknown>) || undefined,
          })
          await reader.cancel().catch(() => undefined)
          return
        } else if (type === 'error') {
          const code = String(data.code || 'ERROR')
          handlers.onError?.(code, aiErrorText(code, String(data.message || '生成失败')))
          await reader.cancel().catch(() => undefined)
          return
        }
      }
      idx = buffer.indexOf('\n\n')
    }
  }
}

export async function stopChat(streamId: string, options?: { keepalive?: boolean }) {
  const token = localStorage.getItem('token')
  await fetch('/api/ai/chat/stop', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ streamId }),
    keepalive: options?.keepalive === true,
  })
}
