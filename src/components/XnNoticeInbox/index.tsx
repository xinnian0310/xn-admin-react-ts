import { Badge, Drawer, Empty, Spin, Typography } from 'antd'
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
        <Spin spinning={loading}>
          {notices.length ? (
            <div>
              {notices.map((item) => (
                <div
                  key={item.id}
                  style={{
                    cursor: 'pointer',
                    opacity: item.read ? 0.7 : 1,
                    padding: '12px 0',
                    borderBottom: '1px solid var(--ant-color-split, #f0f0f0)',
                  }}
                  onClick={() => void openNotice(item)}
                >
                  <div style={{ fontWeight: 600 }}>
                    {!item.read ? <Badge status="processing" /> : null} {item.title}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: 'var(--ant-color-text-secondary, #8c8c8c)',
                    }}
                  >
                    {item.publishedAt || item.receivedAt}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="暂无公告" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Spin>
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
