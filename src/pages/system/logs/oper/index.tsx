import { useEffect, useState } from 'react'
import { Descriptions, Tag, message, Modal } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import XnModal from '@/components/XnModal'
import { usePageUi } from '@/hooks/usePageUi'
import { batchRemove, clean, exportOperLogs, get, list, remove } from '@/api/oper-log'
import { rangeToBeginEnd } from '@/utils/download'
import type { OperLog } from '@/types'
import type { SearchForm } from '@/types/search'
import type { TableColumnItem } from '@/types/table'

function businessTypeLabel(type?: string) {
  const map: Record<string, string> = {
    INSERT: '新增',
    UPDATE: '修改',
    DELETE: '删除',
    GRANT: '授权',
    IMPORT: '导入',
    EXPORT: '导出',
    CLEAN: '清空',
    OTHER: '其他',
  }
  return map[String(type || '')] || type || '—'
}

function listParams(page: number, size: number, query: SearchForm) {
  const statusRaw = query.status
  return {
    page: page - 1,
    size,
    keyword: String(query.FuzzyWord ?? '').trim() || undefined,
    businessType: String(query.businessType ?? '').trim() || undefined,
    status: statusRaw === '' || statusRaw == null ? undefined : Number(statusRaw),
    ...rangeToBeginEnd(query.operTime),
  }
}

export default function SystemOperLogsPage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/logs/oper')
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState<OperLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [selected, setSelected] = useState<OperLog[]>([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [current, setCurrent] = useState<OperLog | null>(null)

  const columns: TableColumnItem[] = [
    { type: 'selection', width: 50, fixed: true },
    { prop: 'title', label: '模块', minWidth: 140 },
    { type: 'slot', slot: 'businessType', prop: 'businessType', label: '业务类型', width: 100 },
    { prop: 'operatorName', label: '操作人', minWidth: 110 },
    { prop: 'requestUrl', label: 'URL', minWidth: 180 },
    { type: 'slot', slot: 'status', prop: 'status', label: '状态', width: 90 },
    { prop: 'costTime', label: '耗时(ms)', width: 100 },
    { prop: 'ip', label: 'IP', minWidth: 120 },
    { prop: 'operTime', label: '操作时间', minWidth: 170, type: 'datetime' },
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

  async function openDetail(row: OperLog) {
    const res = await get(row.id)
    setCurrent(res.data)
    setDetailVisible(true)
  }

  async function handleDelete(row: OperLog) {
    Modal.confirm({
      title: '删除确认',
      content: `确定删除「${row.title}」这条操作日志吗？`,
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
        content: `确定删除选中的 ${selected.length} 条操作日志吗？`,
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
        content: '确定清空全部操作日志吗？此操作不可恢复。',
        okType: 'danger',
        onOk: async () => {
          await clean()
          message.success('已清空')
          setSelected([])
          await loadData()
        },
      })
    } else if (action === 'export') {
      void exportOperLogs(listParams(page, size, queryForm)).then(() => message.success('导出成功'))
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
            tableKey="system:logs:oper"
            entityName="操作日志"
            nameField="title"
            columns={columns}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as unknown as OperLog[])}
            onPageChange={(p, s) => {
              setPage(p)
              setSize(s)
              void loadData(p, s)
            }}
            onRefresh={() => void loadData()}
            slots={{
              businessType: ({ row }) => <>{businessTypeLabel(String(row.businessType ?? ''))}</>,
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
                    const item = r as unknown as OperLog
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
        title="操作日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={720}
        destroyOnHidden
      >
        {current ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="模块">{current.title}</Descriptions.Item>
            <Descriptions.Item label="业务类型">
              {businessTypeLabel(current.businessType)}
            </Descriptions.Item>
            <Descriptions.Item label="操作人">{current.operatorName || '—'}</Descriptions.Item>
            <Descriptions.Item label="请求">
              {current.requestMethod || '—'} {current.requestUrl || ''}
            </Descriptions.Item>
            <Descriptions.Item label="方法">{current.method || '—'}</Descriptions.Item>
            <Descriptions.Item label="IP">{current.ip || '—'}</Descriptions.Item>
            <Descriptions.Item label="耗时(ms)">{current.costTime ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {current.status === 1 ? '成功' : '失败'}
            </Descriptions.Item>
            <Descriptions.Item label="时间">{current.operTime}</Descriptions.Item>
            <Descriptions.Item label="参数">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {current.params || '—'}
              </pre>
            </Descriptions.Item>
            {current.errorMsg ? (
              <Descriptions.Item label="错误">
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {current.errorMsg}
                </pre>
              </Descriptions.Item>
            ) : null}
          </Descriptions>
        ) : null}
      </XnModal>
    </>
  )
}
