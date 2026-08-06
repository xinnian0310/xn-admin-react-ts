import { useEffect, useMemo, useState } from 'react'
import { Descriptions, Modal, Tag, message } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import { usePageUi } from '@/hooks/usePageUi'
import { deleteRedisKey, flushRedis, getRedisMonitor } from '@/api/monitor'
import type { RedisMonitor } from '@/types'
import type { SearchForm } from '@/types/search'
import type { TableColumnItem } from '@/types/table'
import type { ButtonListItem } from '@/types/button'

interface RedisKeyRow {
  key: string
}

const columns: TableColumnItem[] = [
  { type: 'selection', width: 50, fixed: true },
  { prop: 'key', label: 'Key', minWidth: 280, showOverflowTooltip: true },
  { type: 'slot', slot: 'actions', label: '操作', width: 140, fixed: 'right' },
]

export default function MonitorRedisPage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/monitor/redis')
  const [loading, setLoading] = useState(false)
  const [monitor, setMonitor] = useState<RedisMonitor | null>(null)
  const [allData, setAllData] = useState<RedisKeyRow[]>([])
  const [tableData, setTableData] = useState<RedisKeyRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [selected, setSelected] = useState<RedisKeyRow[]>([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentKey, setCurrentKey] = useState('')
  const [detailTitle, setDetailTitle] = useState('缓存详情')

  const toolbarButtons = useMemo(
    () =>
      buttonItems.map((item) => {
        if (item.action === 'delete' && monitor?.status !== 'ENABLED') {
          return { ...item, disabled: true } as ButtonListItem
        }
        return item
      }),
    [buttonItems, monitor?.status],
  )

  const statusLabel =
    monitor?.status === 'ENABLED' ? '已连接' : monitor?.status === 'ERROR' ? '连接失败' : '未启用'
  const statusColor =
    monitor?.status === 'ENABLED' ? 'success' : monitor?.status === 'ERROR' ? 'error' : 'default'

  function applyLocalPage(
    nextPage = page,
    nextSize = size,
    nextQuery = queryForm,
    source = allData,
  ) {
    const kw = String(nextQuery.FuzzyWord ?? '')
      .trim()
      .toLowerCase()
    let rows = source
    if (kw) rows = source.filter((r) => r.key.toLowerCase().includes(kw))
    setTotal(rows.length)
    const start = (nextPage - 1) * nextSize
    setTableData(rows.slice(start, start + nextSize))
  }

  async function loadData() {
    setLoading(true)
    try {
      const res = await getRedisMonitor()
      setMonitor(res.data)
      const rows = (res.data.sampleKeys || []).map((key) => ({ key }))
      setAllData(rows)
      if (res.data.message && res.data.status !== 'ENABLED') {
        if (res.data.status === 'ERROR') message.error(res.data.message)
        else message.info(res.data.message)
      }
      applyLocalPage(page, size, queryForm, rows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openDetail(key: string, editable: boolean) {
    setCurrentKey(key)
    setDetailTitle(editable ? '编辑缓存键' : '查看缓存键')
    setDetailVisible(true)
  }

  async function handleDeleteKey(key: string) {
    if (!key) return
    Modal.confirm({
      title: '删除确认',
      content: `确定删除 Key「${key}」吗？`,
      okType: 'danger',
      onOk: async () => {
        await deleteRedisKey(key)
        message.success('删除成功')
        await loadData()
      },
    })
  }

  async function handleFlush() {
    Modal.confirm({
      title: '危险操作',
      content: '确定清空当前 Redis 数据库吗？此操作不可恢复！',
      okType: 'danger',
      onOk: async () => {
        await flushRedis()
        message.success('已清空')
        await loadData()
      },
    })
  }

  async function buttonClick(action: string) {
    if (action === 'view' || action === 'edit') {
      if (selected.length !== 1) {
        message.warning('请选择一个 Key')
        return
      }
      openDetail(selected[0].key, action === 'edit')
    } else if (action === 'delete') {
      if (selected.length) {
        Modal.confirm({
          title: '删除确认',
          content: `确定删除选中的 ${selected.length} 个 Key 吗？`,
          okType: 'danger',
          onOk: async () => {
            for (const row of selected) {
              await deleteRedisKey(row.key)
            }
            message.success('删除成功')
            setSelected([])
            await loadData()
          },
        })
      } else {
        await handleFlush()
      }
    }
  }

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
          <XnButton listItem={toolbarButtons} selected={selected} onButtonClick={buttonClick} />
        }
        toolbarExtra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Tag color={statusColor}>{statusLabel}</Tag>
            {monitor ? (
              <Tag>
                {monitor.host}:{monitor.port} · Key {monitor.keyCount ?? 0}
              </Tag>
            ) : null}
          </div>
        }
        table={
          <XnTable
            data={tableData as unknown as Record<string, unknown>[]}
            total={total}
            loading={loading}
            page={page}
            pageSize={size}
            tableKey="monitor:redis"
            entityName="缓存键"
            nameField="key"
            rowKey="key"
            columns={columns}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as unknown as RedisKeyRow[])}
            onPageChange={(p, s) => {
              setPage(p)
              setSize(s)
              applyLocalPage(p, s)
            }}
            slots={{
              actions: ({ row }) => (
                <XnTableActions
                  items={tableButtonItems}
                  row={row}
                  onActionClick={({ action, row: r }) => {
                    const key = String(r.key ?? '')
                    if (action === 'view') openDetail(key, false)
                    else if (action === 'edit') openDetail(key, true)
                    else if (action === 'delete') void handleDeleteKey(key)
                  }}
                />
              ),
            }}
          />
        }
      />
      <Modal
        title={detailTitle}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={640}
        destroyOnHidden
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Key">
            <code style={{ wordBreak: 'break-all' }}>{currentKey}</code>
          </Descriptions.Item>
          <Descriptions.Item label="状态">{monitor?.status || '—'}</Descriptions.Item>
          <Descriptions.Item label="地址">
            {monitor ? `${monitor.host}:${monitor.port}` : '—'}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </>
  )
}
