import { useEffect, useRef, useState } from 'react'
import { Card, Tag, message, Modal } from 'antd'
import { useNavigate } from 'react-router-dom'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import { usePageUi } from '@/hooks/usePageUi'
import { list, batchRemove, remove } from '@/api/dict-type'
import type { DictType } from '@/types'
import type { SearchForm } from '@/types/search'
import type { SaveMode } from '@/types/save'
import type { TableColumnItem } from '@/types/table'
import DictTypeSave, { type DictTypeSaveHandle } from './save'

export default function DictsPage() {
  const navigate = useNavigate()
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/dicts')
  const saveRef = useRef<DictTypeSaveHandle>(null)
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState<DictType[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [selected, setSelected] = useState<DictType[]>([])

  const columns: TableColumnItem[] = [
    { type: 'selection', width: 50, fixed: true },
    { prop: 'name', label: '字典名称', minWidth: 160 },
    { type: 'slot', slot: 'type', prop: 'type', label: '字典编码', minWidth: 180 },
    { prop: 'remark', label: '备注', minWidth: 200, showOverflowTooltip: true },
    {
      prop: 'status',
      label: '状态',
      width: 100,
      type: 'tag',
      options: [
        { value: 1, label: '启用', type: 'success' },
        { value: 0, label: '禁用', type: 'danger' },
      ],
    },
    {
      prop: 'builtIn',
      label: '类型',
      width: 100,
      type: 'tag',
      options: [
        { value: true, label: '内置', type: 'warning' },
        { value: false, label: '自定义', type: 'info' },
      ],
    },
    { type: 'slot', slot: 'actions', label: '操作', width: 200, fixed: 'right' },
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
    if (action === 'delete' && row.builtIn) return '内置字典不可删除'
    return false
  }

  function goDictData(row: DictType) {
    navigate(
      `/system/dicts/data?dictType=${encodeURIComponent(row.type)}&dictName=${encodeURIComponent(row.name)}`,
    )
  }

  async function handleDelete(row: DictType) {
    if (row.builtIn) {
      message.warning('内置字典不可删除')
      return
    }
    Modal.confirm({
      title: '删除确认',
      content: `确定删除字典「${row.name}」吗？`,
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
    if (selected.some((r) => r.builtIn)) {
      message.warning('内置字典不可删除，请取消勾选')
      return
    }
    Modal.confirm({
      title: '删除确认',
      content: `确定删除选中的 ${selected.length} 个字典吗？`,
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
    if (action === 'add') {
      openSave('add')
      return
    }
    if (action === 'edit') {
      if (selected.length !== 1) {
        message.warning('请选择一项操作')
        return
      }
      openSave('edit', selected[0].id)
      return
    }
    if (action === 'view') {
      if (selected.length !== 1) {
        message.warning('请选择一项操作')
        return
      }
      openSave('view', selected[0].id)
      return
    }
    if (action === 'delete') void handleBatchDelete()
  }

  function onTableAction(payload: { action: string; row: Record<string, unknown> }) {
    const row = payload.row as unknown as DictType
    if (payload.action === 'data') goDictData(row)
    else if (payload.action === 'edit') openSave('edit', row.id)
    else if (payload.action === 'view') openSave('view', row.id)
    else if (payload.action === 'delete') void handleDelete(row)
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
            tableKey="system:dicts"
            entityName="字典类型"
            nameField="name"
            columns={columns}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as DictType[])}
            onPageChange={(p, s) => {
              setPage(p)
              setSize(s)
              void loadData(p, s)
            }}
            onRefresh={() => void loadData()}
            slots={{
              type: ({ row }) => (
                <code
                  style={{
                    fontSize: 12,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(0,0,0,0.04)',
                  }}
                >
                  {String(row.type ?? '')}
                </code>
              ),
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
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{row.name}</div>
                    <code style={{ fontSize: 12 }}>{row.type}</code>
                  </div>
                  <Tag color={row.builtIn ? 'orange' : 'default'}>
                    {row.builtIn ? '内置' : '自定义'}
                  </Tag>
                </div>
                <div style={{ marginBottom: 8 }}>备注：{row.remark || '—'}</div>
                <div style={{ marginBottom: 12 }}>
                  <Tag color={row.status === 1 ? 'success' : 'error'}>
                    {row.status === 1 ? '启用' : '禁用'}
                  </Tag>
                </div>
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
      <DictTypeSave ref={saveRef} onSuccess={() => void loadData()} />
    </>
  )
}
