import { useEffect, useMemo, useRef, useState } from 'react'
import { Checkbox, Modal, Select, Table, message } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import { usePageUi } from '@/hooks/usePageUi'
import { list, batchRemove, remove, send, readers } from '@/api/message'
import { list as listUsers } from '@/api/user'
import type { Message, MessageReader, User } from '@/types'
import type { ButtonListItem } from '@/types/button'
import type { SearchForm } from '@/types/search'
import type { SaveMode } from '@/types/save'
import type { TableColumnItem } from '@/types/table'
import { formatDateTime } from '@/utils/datetime'
import MessageSave, { type MessageSaveHandle } from './save'

export default function MessagesPage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/messages')
  const saveRef = useRef<MessageSaveHandle>(null)
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState<Message[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [selected, setSelected] = useState<Message[]>([])
  const [sendVisible, setSendVisible] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [sendTargetId, setSendTargetId] = useState<number | null>(null)
  const [sendToAll, setSendToAll] = useState(true)
  const [userIds, setUserIds] = useState<number[]>([])
  const [userOptions, setUserOptions] = useState<User[]>([])
  const [readersVisible, setReadersVisible] = useState(false)
  const [readersLoading, setReadersLoading] = useState(false)
  const [readerRows, setReaderRows] = useState<MessageReader[]>([])

  const columns: TableColumnItem[] = [
    { type: 'selection', width: 50, fixed: true },
    { prop: 'title', label: '标题', minWidth: 200, showOverflowTooltip: true },
    {
      prop: 'status',
      label: '状态',
      width: 100,
      type: 'tag',
      options: [
        { value: 'DRAFT', label: '草稿', type: 'warning' },
        { value: 'SENT', label: '已发送', type: 'success' },
      ],
    },
    { type: 'slot', slot: 'readCount', prop: 'readCount', label: '已读', width: 120 },
    { prop: 'senderName', label: '发送人', width: 120 },
    { prop: 'sentAt', label: '发送时间', minWidth: 170, type: 'datetime' },
    { prop: 'createdAt', label: '创建时间', minWidth: 170, type: 'datetime' },
    { type: 'slot', slot: 'actions', label: '操作', fixed: 'right' },
  ]

  function tableActionsFor(row: Message): ButtonListItem[] {
    return (tableButtonItems || []).filter((item) => {
      if (item.action === 'edit' || item.action === 'delete' || item.action === 'send') {
        return row.status === 'DRAFT'
      }
      if (item.action === 'readers') return row.status === 'SENT'
      return true
    })
  }

  function openSave(mode: SaveMode, id?: number) {
    void saveRef.current?.open(mode, id)
  }

  async function loadData(nextPage = page, nextSize = size, nextQuery = queryForm) {
    setLoading(true)
    try {
      const res = await list({
        page: nextPage - 1,
        size: nextSize,
        keyword: String(nextQuery.FuzzyWord ?? '').trim() || undefined,
        status: String(nextQuery.status ?? '').trim() || undefined,
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

  async function handleDelete(row: Message) {
    Modal.confirm({
      title: '删除确认',
      content: `确定删除「${row.title}」吗？`,
      okType: 'danger',
      onOk: async () => {
        await remove(row.id)
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
    if (selected.some((r) => r.status !== 'DRAFT')) {
      message.warning('仅草稿可删除')
      return
    }
    Modal.confirm({
      title: '删除确认',
      content: `确定删除选中的 ${selected.length} 条消息吗？`,
      okType: 'danger',
      onOk: async () => {
        await batchRemove(selected.map((r) => r.id))
        message.success('删除成功')
        setSelected([])
        await loadData()
      },
    })
  }

  async function openSend(id: number) {
    setSendTargetId(id)
    setSendToAll(true)
    setUserIds([])
    if (!userOptions.length) {
      const res = await listUsers({ page: 0, size: 500 })
      setUserOptions((res.data.records || []).filter((u) => u.status === 1))
    }
    setSendVisible(true)
  }

  async function confirmSend() {
    if (!sendTargetId) return
    if (!sendToAll && !userIds.length) {
      message.warning('请选择接收用户或勾选全部启用用户')
      return
    }
    setSendLoading(true)
    try {
      await send(sendTargetId, {
        sendToAll,
        userIds: sendToAll ? undefined : userIds,
      })
      message.success('发送成功')
      setSendVisible(false)
      await loadData()
    } finally {
      setSendLoading(false)
    }
  }

  async function openReaders(row: Message) {
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
    else if (action === 'edit' && selected.length === 1 && selected[0].status === 'DRAFT') {
      openSave('edit', selected[0].id)
    } else if (action === 'view' && selected.length === 1) {
      openSave('view', selected[0].id)
    } else if (action === 'delete') void handleBatchDelete()
    else if (action === 'send' && selected.length === 1 && selected[0].status === 'DRAFT') {
      void openSend(selected[0].id)
    }
  }

  function onTableAction(payload: { action: string; row: Record<string, unknown> }) {
    const row = payload.row as unknown as Message
    if (payload.action === 'edit') openSave('edit', row.id)
    else if (payload.action === 'view') openSave('view', row.id)
    else if (payload.action === 'delete') void handleDelete(row)
    else if (payload.action === 'send') void openSend(row.id)
    else if (payload.action === 'readers') void openReaders(row)
  }

  const readerColumns = useMemo(
    () => [
      { title: '用户名', dataIndex: 'username' },
      { title: '昵称', dataIndex: 'nickname' },
      {
        title: '阅读时间',
        dataIndex: 'readAt',
        render: (v: string) => formatDateTime(v),
      },
    ],
    [],
  )

  return (
    <>
      <XnPageLayout
        showViewSwitch={false}
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
        toolbar={<XnButton listItem={buttonItems} selected={selected} onButtonClick={buttonClick} />}
        table={
          <XnTable
            data={tableData}
            total={total}
            loading={loading}
            page={page}
            pageSize={size}
            tableKey="system:messages"
            entityName="站内信"
            nameField="title"
            columns={columns}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as Message[])}
            onPageChange={(p, s) => {
              setPage(p)
              setSize(s)
              void loadData(p, s)
            }}
            slots={{
              readCount: ({ row }) => {
                const m = row as unknown as Message
                return m.status === 'DRAFT' ? (
                  <span>—</span>
                ) : (
                  <span>
                    {m.readCount ?? 0} / {m.totalCount ?? 0}
                  </span>
                )
              },
              actions: ({ row }) => (
                <XnTableActions
                  items={tableActionsFor(row as unknown as Message)}
                  row={row}
                  onActionClick={onTableAction}
                />
              ),
            }}
          />
        }
      />
      <MessageSave ref={saveRef} onSuccess={() => void loadData()} />
      <Modal
        title="发送站内信"
        open={sendVisible}
        confirmLoading={sendLoading}
        onCancel={() => setSendVisible(false)}
        onOk={() => void confirmSend()}
        okText="发送"
      >
        <Checkbox checked={sendToAll} onChange={(e) => setSendToAll(e.target.checked)}>
          发送给全部启用用户
        </Checkbox>
        {!sendToAll ? (
          <Select
            mode="multiple"
            style={{ width: '100%', marginTop: 12 }}
            placeholder="选择接收用户"
            value={userIds}
            onChange={setUserIds}
            options={userOptions.map((u) => ({
              label: `${u.nickname || u.username}（${u.username}）`,
              value: u.id,
            }))}
            optionFilterProp="label"
          />
        ) : null}
      </Modal>
      <Modal
        title="已读明细"
        open={readersVisible}
        width={640}
        footer={null}
        destroyOnHidden
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
      </Modal>
    </>
  )
}
