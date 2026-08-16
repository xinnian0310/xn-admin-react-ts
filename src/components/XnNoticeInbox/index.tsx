import { Badge, Drawer, List, Typography } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { resolveAttachmentUrl } from '@/config/app'
import { openKkFileViewPreview } from '@/utils/kk-file-view'
import { useNoticeStore } from '@/stores/notice'
import { resolveAttachments } from '@/utils/attachment'
import { decorateRichHtml } from '@/utils/rich-editor'

export default function XnNoticeInbox() {
  const unreadCount = useNoticeStore((s) => s.unreadCount)
  const drawerVisible = useNoticeStore((s) => s.drawerVisible)
  const notices = useNoticeStore((s) => s.notices)
  const loading = useNoticeStore((s) => s.loading)
  const openDrawer = useNoticeStore((s) => s.openDrawer)
  const closeDrawer = useNoticeStore((s) => s.closeDrawer)
  const openNotice = useNoticeStore((s) => s.openNotice)
  const activeNotice = useNoticeStore((s) => s.activeNotice)
  const closeDetail = useNoticeStore((s) => s.closeDetail)
  const activeAttachments = resolveAttachments(activeNotice)

  return (
    <>
      <Badge count={unreadCount} size="small">
        <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} onClick={openDrawer} />
      </Badge>
      <Drawer title="我的公告" open={drawerVisible} onClose={closeDrawer} size={420}>
        <List
          loading={loading}
          dataSource={notices}
          locale={{ emptyText: '暂无公告' }}
          renderItem={(item) => (
            <List.Item
              style={{ cursor: 'pointer', opacity: item.read ? 0.7 : 1 }}
              onClick={() => void openNotice(item)}
            >
              <List.Item.Meta
                title={
                  <span>
                    {!item.read ? <Badge status="processing" /> : null} {item.title}
                  </span>
                }
                description={item.publishedAt || item.receivedAt}
              />
            </List.Item>
          )}
        />
      </Drawer>
      <Drawer
        title={activeNotice?.title || '公告详情'}
        open={Boolean(activeNotice)}
        onClose={closeDetail}
        size={520}
      >
        {activeAttachments.length ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              marginBottom: 12,
              fontSize: 13,
            }}
          >
            <span style={{ color: 'var(--app-text-muted, #909399)' }}>附件</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              {activeAttachments.map((item) => (
                <div
                  key={item.path}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}
                >
                  <Typography.Link
                    href={resolveAttachmentUrl(item.path)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.name}
                  </Typography.Link>
                  <Typography.Link
                    onClick={(e) => {
                      e.preventDefault()
                      openKkFileViewPreview(item.path, item.name)
                    }}
                  >
                    查看
                  </Typography.Link>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div
          className="xn-rich-html"
          style={{ lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{ __html: decorateRichHtml(activeNotice?.content) }}
        />
      </Drawer>
    </>
  )
}
