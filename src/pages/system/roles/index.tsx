import { useEffect, useRef, useState } from 'react'
import { Card, Switch, Tag, message, Modal } from 'antd'
import { useNavigate } from 'react-router-dom'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import XnAuth from '@/components/XnAuth'
import RoleSave, { type RoleSaveHandle } from './save'
import { usePageUi } from '@/hooks/usePageUi'
import { list, remove, batchRemove, updateStatus } from '@/api/role'
import type { Role } from '@/types'
import type { SearchForm } from '@/types/search'
import type { SaveMode } from '@/types/save'
import type { TableColumnItem } from '@/types/table'

const DATA_SCOPE_LABEL: Record<string, string> = {
  ALL: '全部数据',
  UNIT_AND_CHILDREN: '本单位及下级',
  UNIT: '仅本单位',
  SELF: '仅本人',
}

function dataScopeColor(scope?: string) {
  if (scope === 'ALL') return 'error'
  if (scope === 'UNIT_AND_CHILDREN') return 'success'
  if (scope === 'UNIT') return 'warning'
  return 'default'
}

export default function RolesPage() {
  const navigate = useNavigate()
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/roles')
  const saveRef = useRef<RoleSaveHandle>(null)
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState<Role[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [selected, setSelected] = useState<Role[]>([])

  const columns: TableColumnItem[] = [
    { type: 'selection', width: 50 },
    { prop: 'name', label: '名称', minWidth: 140 },
    { prop: 'code', label: '编码', minWidth: 140 },
    { type: 'slot', slot: 'dataScope', prop: 'dataScope', label: '数据权限', minWidth: 140 },
    { prop: 'description', label: '描述', minWidth: 160, showOverflowTooltip: true },
    {
      type: 'tag',
      prop: 'builtIn',
      label: '类型',
      width: 100,
      options: [
        { value: true, label: '内置', type: 'warning' },
        { value: false, label: '自定义', type: 'info' },
      ],
    },
    { type: 'slot', slot: 'status', prop: 'status', label: '状态', width: 100 },
    { type: 'slot', slot: 'actions', label: '操作', fixed: 'right', width: 200 },
  ]

  async function loadData(nextPage = page, nextSize = size, nextQuery = queryForm) {
    setLoading(true)
    try {
      const keyword =
        String(nextQuery.FuzzyWord ?? nextQuery.name ?? nextQuery.code ?? '').trim() || undefined
      const res = await list({ page: nextPage - 1, size: nextSize, keyword })
      let rows = res.data.records || []
      if (nextQuery.status !== '' && nextQuery.status != null) {
        rows = rows.filter((r) => r.status === Number(nextQuery.status))
      }
      if (nextQuery.builtIn !== '' && nextQuery.builtIn != null) {
        const flag = nextQuery.builtIn === true || nextQuery.builtIn === 'true'
        rows = rows.filter((r) => r.builtIn === flag)
      }
      setTableData(rows)
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

  function tableActionDisabled(action: string, row: Record<string, unknown>) {
    if (action === 'delete' && row.builtIn) return '内置角色不可删除'
    return false
  }

  async function handleDelete(row: Role) {
    if (row.builtIn) {
      message.warning('内置角色不可删除')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定删除角色「${row.name}」吗？`,
      okType: 'danger',
      onOk: async () => {
        await remove(row.id)
        message.success('删除成功')
        await loadData()
      },
    })
  }

  async function handleBatchDelete() {
    if (!selected.length) {
      message.warning('请选择要删除的数据')
      return
    }
    if (selected.some((r) => r.builtIn)) {
      message.warning('选中项包含内置角色，不可删除')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定删除选中的 ${selected.length} 个角色吗？`,
      okType: 'danger',
      onOk: async () => {
        await batchRemove(selected.map((r) => r.id))
        message.success('删除成功')
        setSelected([])
        await loadData()
      },
    })
  }

  async function handleStatusChange(row: Role, val: boolean) {
    const prev = row.status
    try {
      await updateStatus(row.id, val ? 1 : 0)
      message.success('状态已更新')
      await loadData()
    } catch {
      row.status = prev
    }
  }

  function buttonClick(action: string) {
    if (action === 'add') {
      openSave('add')
      return
    }
    if (action === 'edit' || action === 'view') {
      if (selected.length !== 1) {
        message.warning('请选择一项操作')
        return
      }
      openSave(action, selected[0].id)
      return
    }
    if (action === 'delete') void handleBatchDelete()
  }

  function onRowAction(action: string, row: Role) {
    if (action === 'assign') navigate(`/system/permissions?roleId=${row.id}`)
    else if (action === 'delete') void handleDelete(row)
    else if (action === 'edit' || action === 'view') openSave(action, row.id)
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
            tableKey="system:roles"
            entityName="角色"
            columns={columns}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as Role[])}
            onPageChange={(p, s) => {
              setPage(p)
              setSize(s)
              void loadData(p, s)
            }}
            slots={{
              dataScope: ({ row }) => {
                const scope = String(row.dataScope || 'UNIT_AND_CHILDREN')
                return <Tag color={dataScopeColor(scope)}>{DATA_SCOPE_LABEL[scope] || scope}</Tag>
              },
              status: ({ row }) => {
                const r = row as unknown as Role
                return (
                  <XnAuth permission="role:update">
                    <Switch
                      checked={r.status === 1}
                      disabled={r.builtIn && r.code === 'SUPER_ADMIN'}
                      onChange={(val) => void handleStatusChange(r, val)}
                    />
                  </XnAuth>
                )
              },
              actions: ({ row }) => (
                <XnTableActions
                  items={tableButtonItems}
                  row={row}
                  disabled={tableActionDisabled}
                  onActionClick={({ action, row: r }) => onRowAction(action, r as unknown as Role)}
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
              <Card key={row.id} size="small" title={row.name}>
                <div>编码：{row.code}</div>
                <div>
                  <Tag color={row.builtIn ? 'warning' : 'default'}>
                    {row.builtIn ? '内置' : '自定义'}
                  </Tag>
                  <Tag color={dataScopeColor(row.dataScope)}>
                    {DATA_SCOPE_LABEL[row.dataScope || 'UNIT_AND_CHILDREN']}
                  </Tag>
                </div>
                <div>描述：{row.description || '—'}</div>
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <XnAuth permission="role:update">
                    <Switch
                      checked={row.status === 1}
                      disabled={row.builtIn && row.code === 'SUPER_ADMIN'}
                      onChange={(val) => void handleStatusChange(row, val)}
                    />
                  </XnAuth>
                  <XnTableActions
                    items={tableButtonItems}
                    row={row as unknown as Record<string, unknown>}
                    disabled={tableActionDisabled}
                    onActionClick={({ action, row: r }) =>
                      onRowAction(action, r as unknown as Role)
                    }
                  />
                </div>
              </Card>
            ))}
          </div>
        }
      />
      <RoleSave ref={saveRef} onSuccess={() => void loadData()} />
    </>
  )
}
