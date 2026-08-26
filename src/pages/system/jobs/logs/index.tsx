import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tag, message, Modal } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import XnDialog from '@/components/XnDialog'
import XnDesc from '@/components/XnDesc'
import XnCode from '@/components/XnCode'
import { usePageUi } from '@/hooks/usePageUi'
import {
  batchRemoveJobLogs,
  cleanJobLogs,
  exportJobLogs,
  getJobLog,
  listJobLogs,
  removeJobLog,
} from '@/api/job-log'
import { rangeToBeginEnd } from '@/utils/download'
import type { JobLog } from '@/types/job-log'
import type { SearchForm } from '@/types/search'
import type { TableColumnItem } from '@/types/table'

function jobStatusLabel(status?: string) {
  if (status === 'SUCCESS') return '成功'
  if (status === 'FAIL') return '失败'
  if (status === 'SKIP') return '跳过'
  return status || '—'
}

function jobStatusColor(status?: string) {
  if (status === 'SUCCESS') return 'success'
  if (status === 'FAIL') return 'error'
  return 'default'
}

function parseJobId(raw: string | null) {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function listParams(page: number, size: number, query: SearchForm, jobId?: number) {
  return {
    page: page - 1,
    size,
    keyword: String(query.FuzzyWord ?? '').trim() || undefined,
    jobId,
    status: String(query.status ?? '').trim() || undefined,
    ...rangeToBeginEnd(query.range),
  }
}

export default function SystemJobLogsPage() {
  const [searchParams] = useSearchParams()
  const jobId = parseJobId(searchParams.get('jobId'))
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/jobs/logs')
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState<JobLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [selected, setSelected] = useState<JobLog[]>([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [current, setCurrent] = useState<JobLog | null>(null)

  const detailItems = useMemo(() => {
    if (!current) return []
    return [
      { label: '任务', value: current.jobName },
      { label: '状态', value: jobStatusLabel(current.status) },
      { label: '标识', value: current.jobKey, type: 'copy' as const },
      { label: '耗时(ms)', value: current.costMs },
      { label: '调用目标', value: current.invokeTarget, span: 2, type: 'copy' as const },
      { label: '开始', value: current.startTime },
      { label: '结束', value: current.endTime },
    ]
  }, [current])

  const columns: TableColumnItem[] = [
    { type: 'selection', width: 50, fixed: true },
    { prop: 'jobName', label: '任务名称', minWidth: 140 },
    { prop: 'jobKey', label: '标识', minWidth: 140 },
    { type: 'slot', slot: 'status', prop: 'status', label: '状态', width: 90 },
    { prop: 'message', label: '信息', minWidth: 180 },
    { prop: 'startTime', label: '开始时间', minWidth: 170, type: 'datetime' },
    { prop: 'costMs', label: '耗时(ms)', width: 100 },
    { type: 'slot', slot: 'actions', label: '操作', width: 140, fixed: 'right' },
  ]

  async function loadData(
    nextPage = page,
    nextSize = size,
    nextQuery = queryForm,
    nextJobId = jobId,
  ) {
    setLoading(true)
    try {
      const res = await listJobLogs(listParams(nextPage, nextSize, nextQuery, nextJobId))
      setTableData(res.data.records)
      setTotal(res.data.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    void loadData(1, size, queryForm, jobId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  async function openDetail(row: JobLog) {
    const res = await getJobLog(row.id)
    setCurrent(res.data)
    setDetailVisible(true)
  }

  async function handleDelete(row: JobLog) {
    await removeJobLog(row.id)
    message.success('已删除')
    await loadData()
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
        content: `确定删除选中的 ${selected.length} 条任务日志吗？`,
        okType: 'danger',
        onOk: async () => {
          await batchRemoveJobLogs(selected.map((r) => r.id))
          message.success('已删除')
          setSelected([])
          await loadData()
        },
      })
    } else if (action === 'clean') {
      Modal.confirm({
        title: '清空确认',
        content: '确定清空全部任务日志吗？此操作不可恢复。',
        okType: 'danger',
        onOk: async () => {
          await cleanJobLogs()
          message.success('已清空')
          setSelected([])
          await loadData()
        },
      })
    }
  }

  async function handleExport() {
    await exportJobLogs(listParams(page, size, queryForm, jobId))
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
          <XnButton
            listItem={buttonItems}
            selected={selected}
            exportRequest={handleExport}
            onButtonClick={buttonClick}
          />
        }
        table={
          <XnTable
            data={tableData as unknown as Record<string, unknown>[]}
            total={total}
            loading={loading}
            page={page}
            pageSize={size}
            tableKey="system:jobs:logs"
            entityName="任务日志"
            nameField="jobName"
            columns={columns}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as unknown as JobLog[])}
            onPageChange={(p, s) => {
              setPage(p)
              setSize(s)
              void loadData(p, s)
            }}
            onRefresh={() => void loadData()}
            slots={{
              status: ({ row }) => (
                <Tag color={jobStatusColor(String(row.status ?? ''))}>
                  {jobStatusLabel(String(row.status ?? ''))}
                </Tag>
              ),
              actions: ({ row }) => (
                <XnTableActions
                  items={tableButtonItems}
                  row={row}
                  onActionClick={({ action, row: r }) => {
                    const item = r as unknown as JobLog
                    if (action === 'view') void openDetail(item)
                    else if (action === 'delete') void handleDelete(item)
                  }}
                />
              ),
            }}
          />
        }
      />
      <XnDialog
        title="任务日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={820}
        showConfirm={false}
        cancelText="关闭"
      >
        {current ? (
          <>
            <XnDesc column={2} items={detailItems} size="small" />
            {current.message ? (
              <XnCode
                title="信息"
                language="text"
                value={current.message}
                style={{ marginTop: 12 }}
              />
            ) : null}
            {current.exceptionInfo ? (
              <XnCode
                title="异常"
                language="text"
                value={current.exceptionInfo}
                maxHeight="320px"
                style={{ marginTop: 12 }}
              />
            ) : null}
          </>
        ) : null}
      </XnDialog>
    </>
  )
}
