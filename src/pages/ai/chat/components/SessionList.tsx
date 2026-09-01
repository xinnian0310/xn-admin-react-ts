import { useMemo } from 'react'
import { Button, Empty } from 'antd'
import { DeleteOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import type { Conversation } from '@/types/ai/conversation'
import { formatChatTime } from '@/utils/datetime'

interface Props {
  conversations: Conversation[]
  currentId: string
  hasModel: boolean
  hasMore?: boolean
  loadingMore?: boolean
  collapsed?: boolean
  onCreate: () => void
  onOpen: (id: string) => void
  onRemove: (item: Conversation) => void
  onLoadMore: () => void
  onToggle: () => void
}

function sessionTs(item: Conversation) {
  const t = item.lastMessageAt || item.createdAt
  if (!t) return 0
  const ts = new Date(t.replace(' ', 'T')).getTime()
  return Number.isNaN(ts) ? 0 : ts
}

export default function SessionList({
  conversations,
  currentId,
  hasModel,
  hasMore,
  loadingMore,
  collapsed,
  onCreate,
  onOpen,
  onRemove,
  onLoadMore,
  onToggle,
}: Props) {
  const groupedSessions = useMemo(() => {
    const now = Date.now()
    const pinned: Conversation[] = []
    const groups = [
      { label: '置顶', items: pinned },
      { label: '今天', items: [] as Conversation[] },
      { label: '7 天内', items: [] as Conversation[] },
      { label: '更早', items: [] as Conversation[] },
    ]
    const sorted = [...conversations].sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
      return sessionTs(b) - sessionTs(a)
    })
    for (const item of sorted) {
      if (item.pinned) {
        pinned.push(item)
        continue
      }
      const ts = sessionTs(item) || now
      const days = (now - ts) / 86400000
      if (days < 1) groups[1].items.push(item)
      else if (days < 7) groups[2].items.push(item)
      else groups[3].items.push(item)
    }
    return groups
  }, [conversations])

  if (collapsed) {
    return (
      <aside className="ai-chat__sessions is-collapsed">
        <button
          type="button"
          className="ai-chat__sessions-expand"
          title="展开历史对话"
          onClick={onToggle}
        >
          <RightOutlined style={{ fontSize: 16 }} />
          <span>历史</span>
        </button>
      </aside>
    )
  }

  return (
    <aside className="ai-chat__sessions">
      <div className="ai-chat__sessions-head">
        <span>历史对话</span>
        <div className="ai-chat__sessions-actions">
          <Button type="primary" size="small" disabled={!hasModel} onClick={onCreate}>
            新对话
          </Button>
          <Button type="text" size="small" shape="circle" title="收起历史对话" onClick={onToggle}>
            <LeftOutlined />
          </Button>
        </div>
      </div>
      {!conversations.length ? (
        <Empty description="还没有会话" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className="ai-chat__session-list">
          {groupedSessions.map((group) =>
            group.items.length ? (
              <div key={group.label}>
                <div className="ai-chat__group">{group.label}</div>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`ai-chat__session${item.id === currentId ? ' is-active' : ''}`}
                    title={item.title || '新对话'}
                    onClick={() => onOpen(item.id)}
                  >
                    <span className="ai-chat__session-main">
                      <span className="ai-chat__session-title">
                        {item.pinned ? '📌 ' : ''}
                        {item.title || '新对话'}
                      </span>
                      {formatChatTime(item.lastMessageAt || item.createdAt) ? (
                        <span className="ai-chat__session-time">
                          {formatChatTime(item.lastMessageAt || item.createdAt)}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className="ai-chat__session-del"
                      title="删除"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemove(item)
                      }}
                    >
                      <DeleteOutlined />
                    </span>
                  </button>
                ))}
              </div>
            ) : null,
          )}
          {hasMore ? (
            <Button
              type="link"
              className="ai-chat__session-more"
              loading={loadingMore}
              onClick={onLoadMore}
            >
              加载更早的会话
            </Button>
          ) : null}
        </div>
      )}
    </aside>
  )
}
