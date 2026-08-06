import { useEffect, useRef, useState } from 'react'
import { Card, Tag, message, Modal } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import { usePageUi } from '@/hooks/usePageUi'
import { list, batchRemove, remove, updateStatus } from '@/api/login-page'
import type { LoginPageConfig } from '@/types'
import type { SearchForm } from '@/types/search'
import type { SaveMode } from '@/types/save'
import type { TableColumnItem } from '@/types/table'
import LoginPageSave, { type LoginPageSaveHandle } from './save'

function captchaLabel(type?: string | null) {
  if (type === 'SLIDER') return '滑块验证'
  if (type === 'IMAGE') return '图形验证码'
  return '已开启'
}

export default function LoginSettingsPage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/login-settings')
  const saveRef = useRef<LoginPageSaveHandle>(null)
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState<LoginPageConfig[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [selected, setSelected] = useState<LoginPageConfig[]>([])

  const columns: TableColumnItem[] = [
    { type: 'selection', width: 50, fixed: true },
    { prop: 'name', label: '配置名称', minWidth: 140 },
    { type: 'slot', slot: 'captcha', prop: 'captchaEnabled', label: '登录验证', width: 140 },
    {
      prop: 'status',
      label: '状态',
      width: 100,
      type: 'tag',
      options: [
        { value: 1, label: '启用', type: 'success' },
        { value: 0, label: '未启用', type: 'info' },
      ],
    },
    { prop: 'remark', label: '备注', minWidth: 160, showOverflowTooltip: true },
    { type: 'slot', slot: 'actions', label: '操作', width: 240, fixed: 'right' },
  ]

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
        status: nextQuery.status as number | string | undefined,
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

  function tableActionDisabled(action: string, row: Record<string, unknown>) {
    if (action === 'enable' && row.status === 1) return '已是启用状态'
    if (action === 'disable' && row.status === 0) return '已是未启用状态'
    return false
  }

  async function handleStatus(row: LoginPageConfig, status: number) {
    if (status === 1) {
      Modal.confirm({
        title: '启用确认',
        content: `启用「${row.name}」后，其它登录页配置将自动停用，是否继续？`,
        okText: '启用',
        onOk: async () => {
          await updateStatus(row.id, status)
          message.success('已启用')
          await loadData()
        },
      })
      return
    }
    await updateStatus(row.id, status)
    message.success('已停用')
    await loadData()
  }

  async function handleDelete(row: LoginPageConfig) {
    Modal.confirm({
      title: '删除确认',
      content: `确定删除配置「${row.name}」吗？`,
      okType: 'danger',
      okText: '删除',
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
    Modal.confirm({
      title: '删除确认',
      content: `确定删除选中的 ${selected.length} 条配置吗？`,
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

  function buttonClick(action: string) {
    if (action === 'add') openSave('add')
    else if (action === 'edit') {
      if (selected.length !== 1) {
        message.warning('请选择一项操作')
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
  }

  function onTableAction(payload: { action: string; row: Record<string, unknown> }) {
    const row = payload.row as unknown as LoginPageConfig
    if (payload.action === 'edit') openSave('edit', row.id)
    else if (payload.action === 'view') openSave('view', row.id)
    else if (payload.action === 'delete') void handleDelete(row)
    else if (payload.action === 'enable') void handleStatus(row, 1)
    else if (payload.action === 'disable') void handleStatus(row, 0)
  }

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
            tableKey="system:login-settings"
            entityName="登录页配置"
            nameField="name"
            columns={columns}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as LoginPageConfig[])}
            onPageChange={(p, s) => {
              setPage(p)
              setSize(s)
              void loadData(p, s)
            }}
            slots={{
              captcha: ({ row }) => {
                const r = row as unknown as LoginPageConfig
                return r.captchaEnabled ? (
                  <Tag color="processing">{captchaLabel(r.captchaType)}</Tag>
                ) : (
                  <Tag>关闭</Tag>
                )
              },
              actions: ({ row }) => (
                <XnTableActions
                  items={tableButtonItems}
                  row={row}
                  disabled={tableActionDisabled}
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 12,
            }}
          >
            {tableData.map((row) => (
              <Card key={row.id} size="small">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 600 }}>{row.name}</div>
                  <Tag color={row.status === 1 ? 'success' : 'default'}>
                    {row.status === 1 ? '启用' : '未启用'}
                  </Tag>
                </div>
                <div>
                  验证：
                  {row.captchaEnabled ? captchaLabel(row.captchaType) : '关闭'}
                </div>
                <div style={{ marginBottom: 12 }}>备注：{row.remark || '—'}</div>
                <XnTableActions
                  items={tableButtonItems}
                  row={row as unknown as Record<string, unknown>}
                  disabled={tableActionDisabled}
                  onActionClick={onTableAction}
                />
              </Card>
            ))}
          </div>
        }
      />
      <LoginPageSave ref={saveRef} onSuccess={() => void loadData()} />
    </>
  )
}
