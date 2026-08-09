import { useEffect, useState } from 'react'
import { Tag, message, Modal } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import { usePageUi } from '@/hooks/usePageUi'
import { getOnlineUsers, kickUser } from '@/api/monitor'
import type { OnlineUser } from '@/types'
import type { SearchForm } from '@/types/search'
import type { TableColumnItem } from '@/types/table'

function formatDuration(seconds: number) {
  if (!seconds || seconds < 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h} 时 ${m} 分`
  if (m > 0) return `${m} 分 ${s} 秒`
  return `${s} 秒`
}

const columns: TableColumnItem[] = [
  { type: 'selection', width: 50, fixed: true },
  { prop: 'username', label: '用户名', minWidth: 120 },
  { prop: 'nickname', label: '昵称', minWidth: 120 },
  { prop: 'unitName', label: '所属单位', minWidth: 140, showOverflowTooltip: true },
  { prop: 'roles', label: '角色', minWidth: 140, showOverflowTooltip: true },
  { prop: 'ip', label: '客户端 IP', minWidth: 130 },
  { type: 'slot', slot: 'sessionCount', prop: 'sessionCount', label: '连接数', width: 90 },
  { prop: 'loginTime', label: '登录时间', minWidth: 170, type: 'datetime' },
  { type: 'slot', slot: 'onlineSeconds', prop: 'onlineSeconds', label: '在线时长', minWidth: 120 },
  { type: 'slot', slot: 'actions', label: '操作', width: 90, fixed: 'right' },
]

export default function MonitorOnlinePage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/monitor/online')
  const [loading, setLoading] = useState(false)
  const [allData, setAllData] = useState<OnlineUser[]>([])
  const [tableData, setTableData] = useState<OnlineUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [selected, setSelected] = useState<OnlineUser[]>([])

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
    if (kw) {
      rows = source.filter((r) =>
        [r.username, r.nickname, r.ip, r.unitName, r.roles]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(kw)),
      )
    }
    setTotal(rows.length)
    const start = (nextPage - 1) * nextSize
    setTableData(rows.slice(start, start + nextSize))
  }

  async function loadData() {
    setLoading(true)
    try {
      const res = await getOnlineUsers()
      setAllData(res.data)
      applyLocalPage(page, size, queryForm, res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    const timer = setInterval(() => void loadData(), 15000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleOffline(row: OnlineUser) {
    Modal.confirm({
      title: '下线确认',
      content: `确定将用户「${row.nickname || row.username || row.userId}」强制下线吗？`,
      okText: '下线',
      okType: 'danger',
      onOk: async () => {
        await kickUser(row.userId)
        message.success('已下线')
        await loadData()
      },
    })
  }

  function buttonClick(action: string) {
    if (action === 'offline' || action === 'kick') {
      if (selected.length !== 1) {
        message.warning('请选择一名在线用户')
        return
      }
      void handleOffline(selected[0])
    }
  }

  return (
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
      toolbar={<XnButton listItem={buttonItems} selected={selected} onButtonClick={buttonClick} />}
      toolbarExtra={<Tag color="success">当前在线 {allData.length} 人</Tag>}
      table={
        <XnTable
          data={tableData as unknown as Record<string, unknown>[]}
          total={total}
          loading={loading}
          page={page}
          pageSize={size}
          tableKey="monitor:online"
          entityName="在线用户"
          nameField="username"
          rowKey="userId"
          columns={columns}
          actionItems={tableButtonItems}
          onSelectionChange={(rows) => setSelected(rows as unknown as OnlineUser[])}
          onPageChange={(p, s) => {
            setPage(p)
            setSize(s)
            applyLocalPage(p, s)
          }}
          onRefresh={() => void loadData()}
          slots={{
            sessionCount: ({ row }) => <Tag>{String(row.sessionCount ?? 0)}</Tag>,
            onlineSeconds: ({ row }) => <>{formatDuration(Number(row.onlineSeconds || 0))}</>,
            actions: ({ row }) => (
              <XnTableActions
                items={tableButtonItems}
                row={row}
                onActionClick={({ action, row: r }) => {
                  if (action === 'offline' || action === 'kick') {
                    void handleOffline(r as unknown as OnlineUser)
                  }
                }}
              />
            ),
          }}
        />
      }
    />
  )
}
