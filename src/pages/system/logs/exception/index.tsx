import { useEffect, useState } from 'react'
import { Descriptions, message, Modal } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import XnModal from '@/components/XnModal'
import { usePageUi } from '@/hooks/usePageUi'
import { batchRemove, clean, exportExceptionLogs, get, list, remove } from '@/api/exception-log'
import { rangeToBeginEnd } from '@/utils/download'
import type { ExceptionLog } from '@/types'
import type { SearchForm } from '@/types/search'
import type { TableColumnItem } from '@/types/table'

function listParams(page: number, size: number, query: SearchForm) {
  return {
    page: page - 1,
    size,
    keyword: String(query.FuzzyWord ?? '').trim() || undefined,
    ...rangeToBeginEnd(query.operTime),
  }
}

export default function SystemExceptionLogsPage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/logs/exception')
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState<ExceptionLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [selected, setSelected] = useState<ExceptionLog[]>([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [current, setCurrent] = useState<ExceptionLog | null>(null)

  const columns: TableColumnItem[] = [
    { type: 'selection', width: 50, fixed: true },
    { prop: 'exceptionName', label: '异常', minWidth: 180 },
    { prop: 'requestUrl', label: 'URL', minWidth: 180 },
    { prop: 'message', label: '信息', minWidth: 200 },
    { prop: 'operatorName', label: '操作人', minWidth: 110 },
    { prop: 'ip', label: 'IP', minWidth: 120 },
    { prop: 'createdAt', label: '发生时间', minWidth: 170, type: 'datetime' },
    { type: 'slot', slot: 'actions', label: '操作', width: 140, fixed: 'right' },
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

  async function openDetail(row: ExceptionLog) {
    const res = await get(row.id)
    setCurrent(res.data)
    setDetailVisible(true)
  }

  async function handleDelete(row: ExceptionLog) {
    Modal.confirm({
      title: '删除确认',
      content: '确定删除这条异常日志吗？',
      okType: 'danger',
      onOk: async () => {
        await remove(row.id)
        message.success('已删除')
        await loadData()
      },
    })
  }

  function buttonClick(action: string) {
    if (action === 'view') {
      if (selected.length !== 1) {
        message.warning('请选择一条日志')
        return
      }
      void openDetail(selected[0])
    } else if (action === 'delete') {
      if (!selected.length) {
        message.warning('请至少选择一条日志')
        return
      }
      Modal.confirm({
        title: '删除确认',
        content: `确定删除选中的 ${selected.length} 条异常日志吗？`,
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
        content: '确定清空全部异常日志吗？此操作不可恢复。',
        okType: 'danger',
        onOk: async () => {
          await clean()
          message.success('已清空')
          setSelected([])
          await loadData()
        },
      })
    } else if (action === 'export') {
      void exportExceptionLogs(listParams(page, size, queryForm)).then(() =>
        message.success('导出成功'),
      )
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
            data={tableData as unknown as Record<string, unknown>[]}
            total={total}
            loading={loading}
            page={page}
            pageSize={size}
            tableKey="system:logs:exception"
            entityName="异常日志"
            nameField="exceptionName"
            columns={columns}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as unknown as ExceptionLog[])}
            onPageChange={(p, s) => {
              setPage(p)
              setSize(s)
              void loadData(p, s)
            }}
            onRefresh={() => void loadData()}
            slots={{
              actions: ({ row }) => (
                <XnTableActions
                  items={tableButtonItems}
                  row={row}
                  onActionClick={({ action, row: r }) => {
                    const item = r as unknown as ExceptionLog
                    if (action === 'view') void openDetail(item)
                    else if (action === 'delete') void handleDelete(item)
                  }}
                />
              ),
            }}
          />
        }
      />
      <XnModal
        title="异常日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={780}
        destroyOnHidden
      >
        {current ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="请求">
              {current.requestMethod || '—'} {current.requestUrl || ''}
            </Descriptions.Item>
            <Descriptions.Item label="方法">{current.method || '—'}</Descriptions.Item>
            <Descriptions.Item label="类名">{current.className || '—'}</Descriptions.Item>
            <Descriptions.Item label="异常">{current.exceptionName || '—'}</Descriptions.Item>
            <Descriptions.Item label="操作人">{current.operatorName || '—'}</Descriptions.Item>
            <Descriptions.Item label="IP">{current.ip || '—'}</Descriptions.Item>
            <Descriptions.Item label="时间">{current.createdAt}</Descriptions.Item>
            <Descriptions.Item label="信息">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {current.message || '—'}
              </pre>
            </Descriptions.Item>
            <Descriptions.Item label="堆栈">
              <pre
                style={{
                  margin: 0,
                  maxHeight: 240,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontSize: 12,
                }}
              >
                {current.stackTrace || '—'}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </XnModal>
    </>
  )
}
