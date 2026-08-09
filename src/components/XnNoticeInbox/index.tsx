import { Badge, Drawer, List, Typography } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { useNoticeStore } from '@/stores/notice'

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
        <Typography.Paragraph>{activeNotice?.content}</Typography.Paragraph>
      </Drawer>
    </>
  )
}
