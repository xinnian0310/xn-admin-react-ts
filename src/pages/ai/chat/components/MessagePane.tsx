import { forwardRef, useImperativeHandle, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Avatar, Button, Empty, Tag } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { ChatMessage } from '@/types/ai/conversation'
import { useUserStore } from '@/stores/user'
import { renderMarkdown, splitThink } from '@/utils/ai-markdown'
import { aiErrorText } from '@/utils/ai-errors'
import { formatChatTime } from '@/utils/datetime'
import { isImageSrc } from '@/utils/icons'
import { chatModelLabel } from '@/utils/ai-model-cascader'

export interface MessagePaneHandle {
  scrollToBottom: (force: boolean) => void
  stick: () => void
  isFollowing: () => boolean
}

interface Props {
  hasModel: boolean
  unavailableMessage?: string
  currentId: string
  messages: ChatMessage[]
  visibleMessages: ChatMessage[]
  streaming: boolean
  hasMore: boolean
  loadingMore: boolean
  hints: string[]
  assistantIcon?: string | null
  onHint: (text: string) => void
  onLoadMore: () => void
  onCopy: (text: string) => void
  onEdit: (msg: ChatMessage) => void
  onRegenerate: (msg: ChatMessage) => void
  onShiftVersion: (msg: ChatMessage, delta: number) => void
}

const MessagePane = forwardRef<MessagePaneHandle, Props>(function MessagePane(
  {
    hasModel,
    unavailableMessage,
    currentId,
    messages,
    visibleMessages,
    streaming,
    hasMore,
    loadingMore,
    hints,
    assistantIcon,
    onHint,
    onLoadMore,
    onCopy,
    onEdit,
    onRegenerate,
    onShiftVersion,
  },
  ref,
) {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const userAvatar = user?.avatar || undefined
  const userName = user?.nickname || user?.username || '我'
  const userAvatarText = userName.charAt(0).toUpperCase()

  const bodyRef = useRef<HTMLDivElement | null>(null)
  const followRef = useRef(true)
  const [showJump, setShowJump] = useState(false)

  function assistantAvatarSrc(msg: ChatMessage) {
    const icon = msg.providerIcon || assistantIcon
    return isImageSrc(icon) ? icon || undefined : undefined
  }

  function assistantAvatarText(msg: ChatMessage) {
    return chatModelLabel(msg.modelSnapshot).slice(0, 1)
  }

  function thinkingOf(msg: ChatMessage) {
    if (msg.thinking) return msg.thinking
    return splitThink(msg.content || '').thinking
  }

  function answerOf(msg: ChatMessage) {
    if (msg.thinking) return msg.content || ''
    return splitThink(msg.content || '').answer
  }

  function copyTextOf(msg: ChatMessage) {
    return msg.role === 'ASSISTANT' ? answerOf(msg) : msg.content
  }

  function versionsOf(msg: ChatMessage) {
    if (msg.role !== 'ASSISTANT' || !msg.parentId) return [msg]
    return messages.filter((m) => m.role === 'ASSISTANT' && m.parentId === msg.parentId)
  }

  function versionIndex(msg: ChatMessage) {
    return Math.max(
      0,
      versionsOf(msg).findIndex((m) => m.id === msg.id),
    )
  }

  function failText(msg: ChatMessage) {
    return aiErrorText(msg.errorCode || undefined, '生成失败')
  }

  const canRegenerateId = useMemo(() => {
    if (streaming || !visibleMessages.length) return ''
    const last = visibleMessages[visibleMessages.length - 1]
    return last.role === 'ASSISTANT' ? last.id : ''
  }, [streaming, visibleMessages])

  function onScroll() {
    const el = bodyRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distance > 80) {
      followRef.current = false
      setShowJump(true)
    } else {
      followRef.current = true
      setShowJump(false)
    }
  }

  function scrollToBottom(force: boolean) {
    const el = bodyRef.current
    if (!el) return
    if (!force && !followRef.current) return
    el.scrollTop = el.scrollHeight
    setShowJump(false)
  }

  useImperativeHandle(ref, () => ({
    scrollToBottom,
    stick() {
      followRef.current = true
    },
    isFollowing: () => followRef.current,
  }))

  async function onCopyCode(e: MouseEvent<HTMLDivElement>) {
    const btn = (e.target as HTMLElement | null)?.closest?.('.ai-code__copy')
    if (!btn) return
    const code = btn.parentElement?.querySelector('code')?.textContent || ''
    await navigator.clipboard.writeText(code)
    btn.textContent = '已复制'
    window.setTimeout(() => {
      btn.textContent = '复制'
    }, 1200)
  }

  return (
    <div
      ref={bodyRef}
      className="ai-chat__body"
      onScroll={onScroll}
      onClick={(e) => void onCopyCode(e)}
    >
      {!hasModel ? (
        <div className="ai-chat__guide">
          <Empty description={unavailableMessage || '暂无可用模型，请先在「模型」中添加'}>
            <Button type="primary" onClick={() => navigate('/ai/models')}>
              去添加我的模型
            </Button>
          </Empty>
        </div>
      ) : !currentId || (!visibleMessages.length && !streaming) ? (
        <div className="ai-chat__guide">
          <Empty description="开始一段新对话，或点下面的示例">
            <div className="ai-chat__hints">
              {hints.map((q) => (
                <Tag key={q} className="is-clickable" onClick={() => onHint(q)}>
                  {q}
                </Tag>
              ))}
            </div>
          </Empty>
        </div>
      ) : (
        <>
          {hasMore ? (
            <Button
              type="link"
              className="ai-chat__more"
              loading={loadingMore}
              onClick={onLoadMore}
            >
              加载更早的消息
            </Button>
          ) : null}
          {visibleMessages.map((msg) => {
            const versions = versionsOf(msg)
            return (
              <article key={msg.id} className={`ai-msg is-${msg.role.toLowerCase()}`}>
                {msg.role !== 'USER' ? (
                  <Avatar
                    className="ai-msg__avatar is-assistant"
                    size={36}
                    src={assistantAvatarSrc(msg)}
                  >
                    {assistantAvatarText(msg)}
                  </Avatar>
                ) : null}
                <div className="ai-msg__main">
                  <div className="ai-msg__meta">
                    <span>
                      {msg.role === 'USER' ? userName : chatModelLabel(msg.modelSnapshot)}
                    </span>
                    {formatChatTime(msg.createdAt) ? (
                      <span className="ai-msg__time">{formatChatTime(msg.createdAt)}</span>
                    ) : null}
                    {msg.status === 'STOPPED' ? (
                      <span className="is-muted">已停止</span>
                    ) : msg.status === 'FAILED' ? (
                      <span className="is-danger">{failText(msg)}</span>
                    ) : msg.status === 'STREAMING' ? (
                      <span className="is-muted">{streaming ? '生成中…' : '已中断'}</span>
                    ) : null}
                    {versions.length > 1 ? (
                      <span className="ai-msg__ver">
                        <Button type="link" size="small" onClick={() => onShiftVersion(msg, -1)}>
                          上一版
                        </Button>
                        {versionIndex(msg) + 1}/{versions.length}
                        <Button type="link" size="small" onClick={() => onShiftVersion(msg, 1)}>
                          下一版
                        </Button>
                      </span>
                    ) : null}
                  </div>
                  {msg.role === 'ASSISTANT' ? (
                    <div className="ai-msg__bubble ai-msg__md">
                      {thinkingOf(msg) ? (
                        <details
                          className="ai-msg__think"
                          open={streaming && msg.status === 'STREAMING'}
                        >
                          <summary>
                            {streaming && msg.status === 'STREAMING' && !answerOf(msg)
                              ? '思考中…'
                              : '深度思考'}
                          </summary>
                          <pre className="ai-msg__think-body">{thinkingOf(msg)}</pre>
                        </details>
                      ) : null}
                      {answerOf(msg) ? (
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(answerOf(msg)) }} />
                      ) : null}
                    </div>
                  ) : (
                    <div className="ai-msg__bubble ai-msg__plain">{msg.content}</div>
                  )}
                  <div className="ai-msg__ops">
                    <Button type="link" size="small" onClick={() => onCopy(copyTextOf(msg))}>
                      复制
                    </Button>
                    {msg.role === 'USER' && !streaming ? (
                      <Button type="link" size="small" onClick={() => onEdit(msg)}>
                        编辑重发
                      </Button>
                    ) : null}
                    {canRegenerateId === msg.id ? (
                      <Button
                        type="link"
                        size="small"
                        disabled={streaming}
                        onClick={() => onRegenerate(msg)}
                      >
                        重新生成
                      </Button>
                    ) : null}
                  </div>
                </div>
                {msg.role === 'USER' ? (
                  <Avatar className="ai-msg__avatar" size={36} src={userAvatar}>
                    {userAvatarText}
                  </Avatar>
                ) : null}
              </article>
            )
          })}
        </>
      )}
      {showJump ? (
        <Button
          className="ai-chat__jump"
          type="primary"
          shape="round"
          onClick={() => scrollToBottom(true)}
        >
          回到底部
        </Button>
      ) : null}
    </div>
  )
})

export default MessagePane
