import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Table, Tag, message } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import { usePageUi } from '@/hooks/usePageUi'
import {
  list,
  batchPublish,
  batchRemove,
  batchRevoke,
  publish,
  readers,
  remove,
  revoke,
} from '@/api/notice'
import type { Notice, NoticeReader, NoticeStatus } from '@/types'
import type { ButtonListItem } from '@/types/button'
import type { SearchForm } from '@/types/search'
import type { SaveMode } from '@/types/save'
import type { TableColumnItem } from '@/types/table'
import { formatDateTime } from '@/utils/datetime'
import NoticeSave, { type NoticeSaveHandle } from './save'
import XnDialog from '@/components/XnDialog'
import XnModal from '@/components/XnModal'

function statusLabel(status: NoticeStatus) {
  if (status === 'PUBLISHED') return '已下发'
  if (status === 'REVOKED') return '已撤回'
  return '草稿'
}

function statusColor(status: NoticeStatus) {
  if (status === 'PUBLISHED') return 'success'
  if (status === 'REVOKED') return 'default'
  return 'warning'
}

export default function NoticesPage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/notices')
  const saveRef = useRef<NoticeSaveHandle>(null)
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState<Notice[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [selected, setSelected] = useState<Notice[]>([])
  const [readersVisible, setReadersVisible] = useState(false)
  const [readersLoading, setReadersLoading] = useState(false)
  const [readerRows, setReaderRows] = useState<NoticeReader[]>([])

  const columns: TableColumnItem[] = [
    { type: 'selection', width: 50, fixed: true },
    { prop: 'title', label: '标题', minWidth: 200, showOverflowTooltip: true },
    {
      prop: 'status',
      label: '状态',
      width: 110,
      type: 'tag',
      options: [
        { value: 'DRAFT', label: '草稿', type: 'warning' },
        { value: 'PUBLISHED', label: '已下发', type: 'success' },
        { value: 'REVOKED', label: '已撤回', type: 'info' },
      ],
    },
    { type: 'slot', slot: 'readCount', prop: 'readCount', label: '已读', width: 120 },
    { prop: 'publisherName', label: '发布人', width: 120 },
    { prop: 'publishedAt', label: '下发时间', minWidth: 170, type: 'datetime' },
    { prop: 'createdAt', label: '创建时间', minWidth: 170, type: 'datetime' },
    { type: 'slot', slot: 'actions', label: '操作', fixed: 'right' },
  ]

  function tableActionsFor(row: Notice): ButtonListItem[] {
    return (tableButtonItems || []).filter((item) => {
      const action = item.action
      if (action === 'edit' || action === 'delete') return row.status === 'DRAFT'
      if (action === 'publish') return row.status === 'DRAFT' || row.status === 'REVOKED'
      if (action === 'revoke') return row.status === 'PUBLISHED'
      if (action === 'readers') return row.status === 'PUBLISHED' || row.status === 'REVOKED'
      return true
    })
  }

  function openSave(mode: SaveMode, id?: number) {
    void saveRef.current?.open(mode, id)
  }

  async function loadData(nextPage = page, nextSize = size, nextQuery = queryForm) {
    setLoading(true)
    try {
      const status = String(nextQuery.status ?? '').trim()
      const res = await list({
        page: nextPage - 1,
        size: nextSize,
        keyword: String(nextQuery.FuzzyWord ?? '').trim() || undefined,
        status: status || undefined,
      })
      setTableData(res.data.records)
      setTotal(res.data.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDelete(row: Notice) {
    if (row.status !== 'DRAFT') {
      message.warning('仅草稿可删除')
      return
    }
    await remove(row.id)
    message.success('删除成功')
    await loadData()
  }

  async function handleBatchDelete() {
    if (!selected.length) {
      message.warning('请至少选择一项')
      return
    }
    if (selected.some((r) => r.status !== 'DRAFT')) {
      message.warning('仅草稿可删除，请取消勾选非草稿项')
      return
    }
    XnModal.confirm({
      title: '删除确认',
      content: `确定删除选中的 ${selected.length} 条公告吗？`,
      okType: 'danger',
      okText: '删除',
      onOk: async () => {
        await batchRemove(selected.map((r) => r.id))
        message.success('删除成功')
        setSelected([])
        await loadData()
      },
    })
  }

  async function handlePublish(row: Notice) {
    XnModal.confirm({
      title: '下发确认',
      content: `确定下发公告「${row.title}」给全体启用用户吗？`,
      onOk: async () => {
        await publish(row.id)
        message.success('下发成功')
        await loadData()
      },
    })
  }

  async function handleBatchPublish() {
    if (!selected.length) {
      message.warning('请至少选择一项')
      return
    }
    if (selected.some((r) => r.status !== 'DRAFT' && r.status !== 'REVOKED')) {
      message.warning('仅草稿或已撤回可下发，请取消勾选其他状态项')
      return
    }
    XnModal.confirm({
      title: '下发确认',
      content: `确定下发选中的 ${selected.length} 条公告给全体启用用户吗？`,
      onOk: async () => {
        await batchPublish(selected.map((r) => r.id))
        message.success('下发成功')
        setSelected([])
        await loadData()
      },
    })
  }

  async function handleRevoke(row: Notice) {
    XnModal.confirm({
      title: '撤回确认',
      content: `确定撤回公告「${row.title}」吗？`,
      onOk: async () => {
        await revoke(row.id)
        message.success('撤回成功')
        await loadData()
      },
    })
  }

  async function handleBatchRevoke() {
    if (!selected.length) {
      message.warning('请至少选择一项')
      return
    }
    if (selected.some((r) => r.status !== 'PUBLISHED')) {
      message.warning('仅已下发可撤回，请取消勾选其他状态项')
      return
    }
    XnModal.confirm({
      title: '撤回确认',
      content: `确定撤回选中的 ${selected.length} 条公告吗？`,
      onOk: async () => {
        await batchRevoke(selected.map((r) => r.id))
        message.success('撤回成功')
        setSelected([])
        await loadData()
      },
    })
  }

  async function openReaders(row: Notice) {
    setReadersVisible(true)
    setReadersLoading(true)
    try {
      const res = await readers(row.id)
      setReaderRows(res.data || [])
    } finally {
      setReadersLoading(false)
    }
  }

  function buttonClick(action: string) {
    if (action === 'add') openSave('add')
    else if (action === 'edit') {
      if (selected.length !== 1) {
        message.warning('请选择一项操作')
        return
      }
      if (selected[0].status !== 'DRAFT') {
        message.warning('仅草稿可编辑')
        return
      }
      openSave('edit', selected[0].id)
    } else if (action === 'view') {
      if (selected.length !== 1) {
        message.warning('请选择一项操作')
        return
      }
      openSave('view', selected[0].id)
    } else if (action === 'delete') void handleBatchDelete()
    else if (action === 'publish') void handleBatchPublish()
    else if (action === 'revoke') void handleBatchRevoke()
  }

  function onTableAction(payload: { action: string; row: Record<string, unknown> }) {
    const row = payload.row as unknown as Notice
    if (payload.action === 'edit') openSave('edit', row.id)
    else if (payload.action === 'view') openSave('view', row.id)
    else if (payload.action === 'delete') void handleDelete(row)
    else if (payload.action === 'publish') void handlePublish(row)
    else if (payload.action === 'revoke') void handleRevoke(row)
    else if (payload.action === 'readers') void openReaders(row)
  }

  const readerColumns = useMemo(
    () => [
      { title: '用户名', dataIndex: 'username', minWidth: 120 },
      { title: '昵称', dataIndex: 'nickname', minWidth: 120 },
      {
        title: '阅读时间',
        dataIndex: 'readAt',
        minWidth: 170,
        render: (v: string) => formatDateTime(v),
      },
    ],
    [],
  )

  return (
    <>
      <XnPageLayout
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showPagination={viewMode === 'card'}
        page={page}
        pageSize={size}
        total={total}
        loading={viewMode === 'card' ? loading : false}
        onPageChange={(p, s) => {
          setPage(p)
          setSize(s)
          void loadData(p, s)
        }}
        search={
          <XnSearch
            searchItem={searchItems}
            onQueryForm={(form) => {
              setQueryForm(form)
              setPage(1)
              void loadData(1, size, form)
            }}
            onReset={(form) => {
              setQueryForm(form)
              setPage(1)
              void loadData(1, size, form)
            }}
          />
        }
        toolbar={
          <XnButton listItem={buttonItems} selected={selected} onButtonClick={buttonClick} />
        }
        table={
          <XnTable
            data={tableData}
            total={total}
            loading={loading}
            page={page}
            pageSize={size}
            tableKey="system:notices"
            entityName="公告"
            nameField="title"
            columns={columns}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as Notice[])}
            onPageChange={(p, s) => {
              setPage(p)
              setSize(s)
              void loadData(p, s)
            }}
            onRefresh={() => void loadData()}
            slots={{
              readCount: ({ row }) => {
                const n = row as unknown as Notice
                return n.status === 'DRAFT' ? (
                  <span>—</span>
                ) : (
                  <span>
                    {n.readCount ?? 0} / {n.totalCount ?? 0}
                  </span>
                )
              },
              actions: ({ row }) => (
                <XnTableActions
                  items={tableActionsFor(row as unknown as Notice)}
                  row={row}
                  onActionClick={onTableAction}
                />
              ),
            }}
          />
        }
        card={
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            {tableData.map((row) => (
              <Card key={row.id} size="small">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.title}
                  </div>
                  <Tag color={statusColor(row.status)}>{statusLabel(row.status)}</Tag>
                </div>
                <div>
                  已读：
                  {row.status === 'DRAFT' ? '—' : `${row.readCount ?? 0} / ${row.totalCount ?? 0}`}
                </div>
                <div>发布人：{row.publisherName || '—'}</div>
                <div style={{ marginBottom: 12 }}>
                  下发时间：{formatDateTime(row.publishedAt) || '—'}
                </div>
                <XnTableActions
                  items={tableActionsFor(row)}
                  row={row as unknown as Record<string, unknown>}
                  onActionClick={onTableAction}
                />
              </Card>
            ))}
          </div>
        }
      />
      <NoticeSave ref={saveRef} onSuccess={() => void loadData()} />
      <XnDialog
        title="已读明细"
        open={readersVisible}
        width={640}
        showConfirm={false}
        cancelText="关闭"
        onCancel={() => setReadersVisible(false)}
      >
        <Table
          rowKey={(r) => `${r.username}-${r.readAt}`}
          loading={readersLoading}
          dataSource={readerRows}
          columns={readerColumns}
          pagination={false}
          scroll={{ y: 420 }}
          size="small"
        />
      </XnDialog>
    </>
  )
}
