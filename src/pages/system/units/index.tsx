import { useEffect, useMemo, useRef, useState, type Key } from 'react'
import { Card, Switch, Tag, message, Modal, Table } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import UnitSave, { type UnitSaveHandle } from './save'
import UnitAssignRoles, { type UnitAssignRolesHandle } from './assign-roles'
import { usePageUi } from '@/hooks/usePageUi'
import { list, remove, batchRemove, updateStatus } from '@/api/unit'
import type { SysUnit } from '@/types'
import type { SearchForm } from '@/types/search'
import type { SaveMode } from '@/types/save'

function flattenUnits(nodes: SysUnit[]): SysUnit[] {
  const result: SysUnit[] = []
  const walk = (list: SysUnit[]) => {
    for (const n of list) {
      result.push(n)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return result
}

function normalizeQuery(form: SearchForm) {
  const next: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(form)) {
    if (v === '' || v == null) continue
    next[k] = v
  }
  if (next.FuzzyWord) {
    next.keyword = next.FuzzyWord
    delete next.FuzzyWord
  }
  return next
}

export default function UnitsPage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/units')
  const saveRef = useRef<UnitSaveHandle>(null)
  const assignRef = useRef<UnitAssignRolesHandle>(null)
  const [loading, setLoading] = useState(false)
  const [treeData, setTreeData] = useState<SysUnit[]>([])
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [selected, setSelected] = useState<SysUnit[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([])
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)

  const flat = useMemo(() => flattenUnits(treeData), [treeData])
  const cardData = useMemo(() => {
    const start = (page - 1) * size
    return flat.slice(start, start + size)
  }, [flat, page, size])

  async function loadData(nextQuery = queryForm) {
    setLoading(true)
    try {
      const res = await list(normalizeQuery(nextQuery))
      setTreeData(res.data || [])
      setSelected([])
      setSelectedKeys([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openSave(mode: SaveMode, id?: number, parentId?: number) {
    void saveRef.current?.open(mode, id, parentId != null ? { parentId } : undefined)
  }

  function tableActionDisabled(action: string, row: Record<string, unknown>) {
    if (action === 'delete' && row.builtIn) return '内置单位不可删除'
    return false
  }

  async function handleDelete(row: SysUnit) {
    if (row.builtIn) {
      message.warning('内置单位不可删除')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定删除单位「${row.name}」吗？`,
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
    if (selected.some((u) => u.builtIn)) {
      message.warning('选中项包含内置单位，不可删除')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定删除选中的 ${selected.length} 个单位吗？`,
      okType: 'danger',
      onOk: async () => {
        await batchRemove(selected.map((u) => u.id))
        message.success('删除成功')
        await loadData()
      },
    })
  }

  async function handleStatusChange(row: SysUnit, checked: boolean) {
    const prev = row.status
    row.status = checked ? 1 : 0
    setTreeData((t) => [...t])
    try {
      await updateStatus(row.id, checked ? 1 : 0)
      message.success('状态已更新')
    } catch {
      row.status = prev
      setTreeData((t) => [...t])
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

  function onRowAction(action: string, row: SysUnit) {
    if (action === 'delete') void handleDelete(row)
    else if (action === 'edit' || action === 'view') openSave(action, row.id)
    else if (action === 'add-child') openSave('add', undefined, row.id)
    else if (action === 'assign') void assignRef.current?.open(row)
  }

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name', minWidth: 160 },
    { title: '编码', dataIndex: 'code', key: 'code', minWidth: 120 },
    {
      title: '默认角色',
      key: 'roles',
      minWidth: 160,
      render: (_: unknown, row: SysUnit) =>
        row.roleList?.length ? (
          row.roleList.map((r) => (
            <Tag key={r.id} style={{ marginBottom: 2 }}>
              {r.name}
            </Tag>
          ))
        ) : (
          <span style={{ color: '#94a3b8' }}>—</span>
        ),
    },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, minWidth: 180 },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: number, row: SysUnit) => (
        <Switch
          checked={v === 1}
          disabled={row.builtIn}
          onChange={(checked) => void handleStatusChange(row, checked)}
        />
      ),
    },
    {
      title: '类型',
      dataIndex: 'builtIn',
      key: 'builtIn',
      width: 100,
      render: (v: boolean) => <Tag color={v ? 'warning' : 'default'}>{v ? '内置' : '自定义'}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right' as const,
      align: 'center' as const,
      width: 220,
      render: (_: unknown, row: SysUnit) => (
        <XnTableActions
          items={tableButtonItems}
          row={row as unknown as Record<string, unknown>}
          disabled={tableActionDisabled}
          onActionClick={({ action, row: r }) => onRowAction(action, r as unknown as SysUnit)}
        />
      ),
    },
  ]

  return (
    <>
      <XnPageLayout
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showPagination={viewMode === 'card'}
        page={page}
        pageSize={size}
        total={flat.length}
        loading={viewMode === 'card' ? loading : false}
        onPageChange={(p, s) => {
          setPage(p)
          setSize(s)
        }}
        search={
          <XnSearch
            searchItem={searchItems}
            onQueryForm={(form) => {
              setQueryForm(form)
              void loadData(form)
            }}
            onReset={(form) => {
              setQueryForm(form)
              void loadData(form)
            }}
          />
        }
        toolbar={
          <XnButton listItem={buttonItems} selected={selected} onButtonClick={buttonClick} />
        }
        table={
          <Table
            rowKey="id"
            loading={loading}
            dataSource={treeData}
            columns={columns}
            pagination={false}
            defaultExpandAllRows
            scroll={{ x: 'max-content' }}
            rowSelection={{
              selectedRowKeys: selectedKeys,
              checkStrictly: true,
              onChange: (keys, rows) => {
                setSelectedKeys(keys)
                setSelected(rows)
              },
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
            {cardData.map((row) => (
              <Card key={row.id} size="small" title={row.name}>
                <div>编码：{row.code}</div>
                <div>
                  类型：
                  <Tag color={row.builtIn ? 'warning' : 'default'}>
                    {row.builtIn ? '内置' : '自定义'}
                  </Tag>
                </div>
                <div>角色：{(row.roleList || []).map((r) => r.name).join('、') || '—'}</div>
                <div>描述：{row.description || '—'}</div>
                <div style={{ marginTop: 8 }}>
                  <Tag color={row.status === 1 ? 'success' : 'default'}>
                    {row.status === 1 ? '启用' : '禁用'}
                  </Tag>
                </div>
                <div style={{ marginTop: 8 }}>
                  <XnTableActions
                    items={tableButtonItems}
                    row={row as unknown as Record<string, unknown>}
                    disabled={tableActionDisabled}
                    onActionClick={({ action, row: r }) =>
                      onRowAction(action, r as unknown as SysUnit)
                    }
                  />
                </div>
              </Card>
            ))}
          </div>
        }
      />
      <UnitSave ref={saveRef} onSuccess={() => void loadData()} />
      <UnitAssignRoles ref={assignRef} onSuccess={() => void loadData()} />
    </>
  )
}
