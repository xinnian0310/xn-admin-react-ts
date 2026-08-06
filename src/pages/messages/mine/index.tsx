import { useEffect, useState } from 'react'
import { Modal, Tag, message } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import { usePageUi } from '@/hooks/usePageUi'
import { batchRemoveMine, listMine, markRead, removeMine, unreadCount } from '@/api/message'
import type { MyMessage } from '@/types'
import type { SearchForm } from '@/types/search'
import type { TableColumnItem } from '@/types/table'
import { formatDateTime } from '@/utils/datetime'

export default function MessagesMinePage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/messages/mine')
  const [loading, setLoading] = useState(false)
  const [allData, setAllData] = useState<MyMessage[]>([])
  const [tableData, setTableData] = useState<MyMessage[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [selected, setSelected] = useState<MyMessage[]>([])
  const [unread, setUnread] = useState(0)
  const [detailVisible, setDetailVisible] = useState(false)
  const [current, setCurrent] = useState<MyMessage | null>(null)

  const columns: TableColumnItem[] = [
    { type: 'selection', width: 50, fixed: true },
    { prop: 'title', label: '标题', minWidth: 200, showOverflowTooltip: true },
    { prop: 'senderName', label: '发送人', width: 120 },
    { type: 'slot', slot: 'sentAt', prop: 'sentAt', label: '发送时间', minWidth: 170 },
    { type: 'slot', slot: 'read', prop: 'read', label: '状态', width: 90 },
    { type: 'slot', slot: 'actions', label: '操作', width: 120, fixed: 'right' },
  ]

  function applyLocalPage(
    nextPage = page,
    nextSize = size,
    nextQuery = queryForm,
    source = allData,
  ) {
    const kw = String(nextQuery.FuzzyWord ?? '')
      .trim()
      .toLowerCase()
    const readFilter = nextQuery.read
    let rows = source
    if (kw) {
      rows = rows.filter((r) =>
        [r.title, r.senderName].filter(Boolean).some((v) => String(v).toLowerCase().includes(kw)),
      )
    }
    if (
      readFilter === true ||
      readFilter === false ||
      readFilter === 'true' ||
      readFilter === 'false'
    ) {
      const wantRead = readFilter === true || readFilter === 'true'
      rows = rows.filter((r) => r.read === wantRead)
    }
    setTotal(rows.length)
    const start = (nextPage - 1) * nextSize
    setTableData(rows.slice(start, start + nextSize))
  }

  async function loadUnread() {
    const res = await unreadCount()
    setUnread(res.data.count)
  }

  async function loadData() {
    setLoading(true)
    try {
      const res = await listMine()
      setAllData(res.data)
      await loadUnread()
      applyLocalPage(page, size, queryForm, res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function openDetail(row: MyMessage) {
    setCurrent(row)
    setDetailVisible(true)
    if (!row.read) {
      await markRead(row.id)
      const next = allData.map((m) => (m.id === row.id ? { ...m, read: true } : m))
      setAllData(next)
      setUnread((n) => Math.max(0, n - 1))
      applyLocalPage(page, size, queryForm, next)
    }
  }

  async function handleDelete(row: MyMessage) {
    Modal.confirm({
      title: '删除确认',
      content: `确定删除消息「${row.title}」吗？`,
      okType: 'danger',
      onOk: async () => {
        await removeMine(row.id)
        message.success('删除成功')
        await loadData()
      },
    })
  }

  async function handleBatchDelete() {
    if (!selected.length) {
      message.warning('请至少选择一项')
      return
    }
    Modal.confirm({
      title: '删除确认',
      content: `确定删除选中的 ${selected.length} 条消息吗？`,
      okType: 'danger',
      onOk: async () => {
        await batchRemoveMine(selected.map((r) => r.id))
        message.success('删除成功')
        setSelected([])
        await loadData()
      },
    })
  }

  async function buttonClick(action: string) {
    if (action === 'view') {
      if (selected.length !== 1) {
        message.warning('请选择一条消息')
        return
      }
      await openDetail(selected[0])
    } else if (action === 'delete') {
      await handleBatchDelete()
    }
  }

  return (
    <>
      <XnPageLayout
        showViewSwitch={false}
        page={page}
        pageSize={size}
        total={total}

        onPageChange={(p, s) => {
          setPage(p)
          setSize(s)
          applyLocalPage(p, s)
        }}
        search={
          <XnSearch
            searchItem={searchItems}
            onQueryForm={(form) => {
              setQueryForm(form)
              setPage(1)
              applyLocalPage(1, size, form)
            }}
            onReset={(form) => {
              setQueryForm(form)
              setPage(1)
              applyLocalPage(1, size, form)
            }}
          />
        }
        toolbar={
          <XnButton
            listItem={buttonItems}
            selected={selected}
            onButtonClick={(a) => void buttonClick(a)}
          />
        }
        toolbarExtra={
          unread > 0 ? (
            <Tag color="error" style={{ borderRadius: 999 }}>
              未读 {unread}
            </Tag>
          ) : null
        }
        table={
          <XnTable
            data={tableData}
            total={total}
            loading={loading}
            page={page}
            pageSize={size}
            tableKey="messages:mine"
            entityName="消息"
            nameField="title"
            columns={columns}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as MyMessage[])}
            onPageChange={(p, s) => {
              setPage(p)
              setSize(s)
              applyLocalPage(p, s)
            }}
            slots={{
              sentAt: ({ row }) => formatDateTime((row as unknown as MyMessage).sentAt) || '—',
              read: ({ row }) => {
                const m = row as unknown as MyMessage
                return <Tag color={m.read ? 'default' : 'error'}>{m.read ? '已读' : '未读'}</Tag>
              },
              actions: ({ row }) => (
                <XnTableActions
                  items={tableButtonItems}
                  row={row}
                  onActionClick={({ action, row: r }) => {
                    const m = r as unknown as MyMessage
                    if (action === 'view') void openDetail(m)
                    else if (action === 'delete') void handleDelete(m)
                  }}
                />
              ),
            }}
          />
        }
      />
      <Modal
        title={current?.title || '消息详情'}
        open={detailVisible}
        width={720}
        footer={null}
        destroyOnHidden
        onCancel={() => setDetailVisible(false)}
      >
        {current ? (
          <div>
            <div
              style={{ display: 'flex', gap: 24, marginBottom: 16, color: '#64748b', fontSize: 13 }}
            >
              <span>发送人：{current.senderName || '—'}</span>
              <span>发送时间：{formatDateTime(current.sentAt)}</span>
            </div>
            <div
              style={{ lineHeight: 1.7, minHeight: 120 }}
              dangerouslySetInnerHTML={{ __html: current.content || '' }}
            />
          </div>
        ) : null}
      </Modal>
    </>
  )
}
