import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, message, Modal } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import JobSave, { type JobSaveHandle } from './save'
import { usePageUi } from '@/hooks/usePageUi'
import { batchRemoveJobs, listJobs, removeJob, runJob } from '@/api/file-job'
import type { Job } from '@/types'
import type { SearchForm } from '@/types/search'
import type { SaveMode } from '@/types/save'
import type { TableColumnItem } from '@/types/table'

function misfireLabel(policy?: string) {
  switch (policy) {
    case '1':
      return '忽略补齐'
    case '2':
      return '补偿一次'
    case '3':
      return '不触发'
    default:
      return '默认'
  }
}

export default function SystemJobsPage() {
  const navigate = useNavigate()
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/jobs')
  const saveRef = useRef<JobSaveHandle>(null)
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [selected, setSelected] = useState<Job[]>([])

  const columns: TableColumnItem[] = [
    { type: 'selection', width: 50, fixed: true },
    { prop: 'name', label: '任务名称', minWidth: 140 },
    { prop: 'jobKey', label: '任务标识', minWidth: 140 },
    { prop: 'cron', label: 'Cron', minWidth: 140 },
    { type: 'longText', prop: 'invokeTarget', label: '调用目标', minWidth: 180 },
    { type: 'slot', slot: 'misfirePolicy', prop: 'misfirePolicy', label: 'misfire', width: 120 },
    { type: 'slot', slot: 'status', prop: 'status', label: '状态', width: 90 },
    { prop: 'lastRunAt', label: '上次执行', minWidth: 170, type: 'datetime' },
    { prop: 'lastStatus', label: '执行结果', width: 100 },
    { type: 'slot', slot: 'actions', label: '操作', fixed: 'right' },
  ]

  async function loadData(nextPage = page, nextSize = size, nextQuery = queryForm) {
    setLoading(true)
    try {
      const statusRaw = nextQuery.status
      const res = await listJobs({
        page: nextPage - 1,
        size: nextSize,
        keyword: String(nextQuery.FuzzyWord ?? '').trim() || undefined,
        status: statusRaw === '' || statusRaw == null ? undefined : Number(statusRaw),
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

  function openSave(mode: SaveMode, id?: number) {
    void saveRef.current?.open(mode, id)
  }

  async function handleDelete(row: Job) {
    Modal.confirm({
      title: '删除确认',
      content: `确定删除任务「${row.name}」吗？`,
      okType: 'danger',
      onOk: async () => {
        await removeJob(row.id)
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
      content: `确定删除选中的 ${selected.length} 个任务吗？`,
      okType: 'danger',
      onOk: async () => {
        await batchRemoveJobs(selected.map((r) => r.id))
        message.success('删除成功')
        setSelected([])
        await loadData()
      },
    })
  }

  async function handleRun(row: Job) {
    await runJob(row.id)
    message.success('已触发执行')
    await loadData()
  }

  function goLogs(jobId?: number) {
    navigate(jobId != null ? `/system/jobs/logs?jobId=${jobId}` : '/system/jobs/logs')
  }

  function buttonClick(action: string) {
    if (action === 'add') openSave('add')
    else if (action === 'edit' && selected.length === 1) openSave('edit', selected[0].id)
    else if (action === 'view' && selected.length === 1) openSave('view', selected[0].id)
    else if (action === 'delete') void handleBatchDelete()
    else if (action === 'run' && selected.length === 1) void handleRun(selected[0])
    else if (action === 'logs') goLogs(selected.length === 1 ? selected[0].id : undefined)
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
            tableKey="system:jobs"
            entityName="定时任务"
            nameField="name"
            columns={columns}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as unknown as Job[])}
            onPageChange={(p, s) => {
              setPage(p)
              setSize(s)
              void loadData(p, s)
            }}
            slots={{
              misfirePolicy: ({ row }) => <>{misfireLabel(String(row.misfirePolicy ?? ''))}</>,
              status: ({ row }) => (
                <Tag color={row.status === 1 ? 'success' : 'default'}>
                  {row.status === 1 ? '启用' : '停用'}
                </Tag>
              ),
              actions: ({ row }) => (
                <XnTableActions
                  items={tableButtonItems}
                  row={row}
                  onActionClick={({ action, row: r }) => {
                    const job = r as unknown as Job
                    if (action === 'edit') openSave('edit', job.id)
                    else if (action === 'view') openSave('view', job.id)
                    else if (action === 'delete') void handleDelete(job)
                    else if (action === 'run') void handleRun(job)
                    else if (action === 'logs') goLogs(job.id)
                  }}
                />
              ),
            }}
          />
        }
      />
      <JobSave ref={saveRef} onSuccess={() => void loadData()} />
    </>
  )
}
