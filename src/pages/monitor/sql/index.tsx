import { useEffect, useState } from 'react'
import { Descriptions, Modal, Tag, message } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import { usePageUi } from '@/hooks/usePageUi'
import { cleanSqlMonitor, getSqlMonitor, removeSqlRecord } from '@/api/monitor'
import { formatDateTime } from '@/utils/datetime'
import type { SqlRecord } from '@/types'
import type { SearchForm } from '@/types/search'
import type { TableColumnItem } from '@/types/table'

const columns: TableColumnItem[] = [
  { type: 'selection', width: 50, fixed: true },
  { type: 'slot', slot: 'executedAt', prop: 'executedAt', label: '执行时间', width: 170 },
  { type: 'slot', slot: 'durationMs', prop: 'durationMs', label: '耗时(ms)', width: 100 },
  { type: 'longText', prop: 'sql', label: 'SQL', minWidth: 420, longTextMaxLength: 64 },
  { type: 'slot', slot: 'actions', label: '操作', width: 140, fixed: 'right' },
]

export default function MonitorSqlPage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/monitor/sql')
  const [loading, setLoading] = useState(false)
  const [allData, setAllData] = useState<SqlRecord[]>([])
  const [tableData, setTableData] = useState<SqlRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryCount, setQueryCount] = useState(0)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [selected, setSelected] = useState<SqlRecord[]>([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [current, setCurrent] = useState<SqlRecord | null>(null)

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
        String(r.sql || '')
          .toLowerCase()
          .includes(kw),
      )
    }
    setTotal(rows.length)
    const start = (nextPage - 1) * nextSize
    setTableData(rows.slice(start, start + nextSize))
  }

  async function loadData() {
    setLoading(true)
    try {
      const res = await getSqlMonitor()
      const records = res.data.records || []
      setAllData(records)
      setQueryCount(res.data.queryCount ?? records.length)
      applyLocalPage(page, size, queryForm, records)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    const timer = setInterval(() => void loadData(), 10000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openDetail(row: SqlRecord) {
    setCurrent(row)
    setDetailVisible(true)
  }

  async function handleDelete(row: SqlRecord) {
    if (row.id == null) {
      message.warning('无法删除该记录')
      return
    }
    Modal.confirm({
      title: '删除确认',
      content: '确定删除该条 SQL 记录吗？',
      okType: 'danger',
      onOk: async () => {
        await removeSqlRecord(row.id!)
        message.success('删除成功')
        await loadData()
      },
    })
  }

  async function buttonClick(action: string) {
    if (action === 'view' || action === 'edit') {
      if (selected.length !== 1) {
        message.warning('请选择一条 SQL 记录')
        return
      }
      openDetail(selected[0])
    } else if (action === 'delete') {
      if (selected.length) {
        Modal.confirm({
          title: '删除确认',
          content: `确定删除选中的 ${selected.length} 条 SQL 记录吗？`,
          okType: 'danger',
          onOk: async () => {
            for (const row of selected) {
              if (row.id != null) await removeSqlRecord(row.id)
            }
            message.success('删除成功')
            setSelected([])
            await loadData()
          },
        })
      } else {
        Modal.confirm({
          title: '清空确认',
          content: '确定清空全部 SQL 监控缓冲吗？',
          okType: 'danger',
          onOk: async () => {
            await cleanSqlMonitor()
            message.success('已清空')
            await loadData()
          },
        })
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
          <XnButton listItem={buttonItems} selected={selected} onButtonClick={buttonClick} />
        }
        toolbarExtra={<Tag>累计 {queryCount} 条</Tag>}
        table={
          <XnTable
            data={tableData as unknown as Record<string, unknown>[]}
            total={total}
            loading={loading}
            page={page}
            pageSize={size}
            tableKey="monitor:sql"
            entityName="SQL"
            nameField="sql"
            columns={columns}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as unknown as SqlRecord[])}
            onPageChange={(p, s) => {
              setPage(p)
              setSize(s)
              applyLocalPage(p, s)
            }}
            slots={{
              executedAt: ({ row }) => <>{formatDateTime(row.executedAt as string)}</>,
              durationMs: ({ row }) => <>{row.durationMs ?? '—'}</>,
              actions: ({ row }) => (
                <XnTableActions
                  items={tableButtonItems}
                  row={row}
                  onActionClick={({ action, row: r }) => {
                    const item = r as unknown as SqlRecord
                    if (action === 'view' || action === 'edit') openDetail(item)
                    else if (action === 'delete') void handleDelete(item)
                  }}
                />
              ),
            }}
          />
        }
      />
      <Modal
        title="SQL 详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={780}
        destroyOnHidden
      >
        {current ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="执行时间">
              {formatDateTime(current.executedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="耗时(ms)">{current.durationMs ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="SQL">
              <pre
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {current.sql}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </>
  )
}
