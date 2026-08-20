import { useEffect, useState } from 'react'
import { Tag, message, Modal } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import { usePageUi } from '@/hooks/usePageUi'
import { batchRemove, clean, exportLoginLogs, list, remove } from '@/api/login-log'
import { rangeToBeginEnd } from '@/utils/download'
import type { LoginLog } from '@/types'
import type { SearchForm } from '@/types/search'
import type { TableColumnItem } from '@/types/table'

function listParams(page: number, size: number, query: SearchForm) {
  const statusRaw = query.status
  return {
    page: page - 1,
    size,
    keyword: String(query.FuzzyWord ?? '').trim() || undefined,
    status: statusRaw === '' || statusRaw == null ? undefined : Number(statusRaw),
    ...rangeToBeginEnd(query.loginTime),
  }
}

export default function SystemLoginLogsPage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/logs/login')
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState<LoginLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [selected, setSelected] = useState<LoginLog[]>([])

  const columns: TableColumnItem[] = [
    { type: 'selection', width: 50, fixed: true },
    { prop: 'username', label: '用户名', minWidth: 120 },
    { prop: 'ip', label: 'IP', minWidth: 130 },
    { type: 'slot', slot: 'status', prop: 'status', label: '状态', width: 90 },
    { prop: 'message', label: '说明', minWidth: 180 },
    { prop: 'userAgent', label: 'User-Agent', minWidth: 220 },
    { prop: 'loginTime', label: '登录时间', minWidth: 170, type: 'datetime' },
    { type: 'slot', slot: 'actions', label: '操作', width: 100, fixed: 'right' },
  ]

  async function loadData(nextPage = page, nextSize = size, nextQuery = queryForm) {
    setLoading(true)
    try {
      const res = await list(listParams(nextPage, nextSize, nextQuery))
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

  async function handleDelete(row: LoginLog) {
    Modal.confirm({
      title: '删除确认',
      content: `确定删除用户「${row.username}」的这条登录日志吗？`,
      okType: 'danger',
      onOk: async () => {
        await remove(row.id)
        message.success('已删除')
        await loadData()
      },
    })
  }

  function buttonClick(action: string) {
    if (action === 'delete') {
      if (!selected.length) {
        message.warning('请至少选择一条日志')
        return
      }
      Modal.confirm({
        title: '删除确认',
        content: `确定删除选中的 ${selected.length} 条登录日志吗？`,
        okType: 'danger',
        onOk: async () => {
          await batchRemove(selected.map((r) => r.id))
          message.success('已删除')
          setSelected([])
          await loadData()
        },
      })
    } else if (action === 'clean') {
      Modal.confirm({
        title: '清空确认',
        content: '确定清空全部登录日志吗？此操作不可恢复。',
        okType: 'danger',
        onOk: async () => {
          await clean()
          message.success('已清空')
          setSelected([])
          await loadData()
        },
      })
    } else if (action === 'export') {
      void exportLoginLogs(listParams(page, size, queryForm)).then(() =>
        message.success('导出成功'),
      )
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
          data={tableData as unknown as Record<string, unknown>[]}
          total={total}
          loading={loading}
          page={page}
          pageSize={size}
          tableKey="system:logs:login"
          entityName="登录日志"
          nameField="username"
          columns={columns}
          actionItems={tableButtonItems}
          onSelectionChange={(rows) => setSelected(rows as unknown as LoginLog[])}
          onPageChange={(p, s) => {
            setPage(p)
            setSize(s)
            void loadData(p, s)
          }}
          onRefresh={() => void loadData()}
          slots={{
            status: ({ row }) => (
              <Tag color={row.status === 1 ? 'success' : 'error'}>
                {row.status === 1 ? '成功' : '失败'}
              </Tag>
            ),
            actions: ({ row }) => (
              <XnTableActions
                items={tableButtonItems}
                row={row}
                onActionClick={({ action, row: r }) => {
                  const item = r as unknown as LoginLog
                  if (action === 'delete') void handleDelete(item)
                }}
              />
            ),
          }}
        />
      }
    />
  )
}
