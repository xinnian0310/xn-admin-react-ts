import { useEffect, useMemo, useRef, useState, type Key } from 'react'
import { Card, Tag, message, Modal, Table } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnAppIcon from '@/components/XnAppIcon'
import RouteSave, { type RouteSaveHandle } from './save'
import RouteCodegen, { type RouteCodegenHandle } from './codegen'
import { usePageUi } from '@/hooks/usePageUi'
import { list, remove, batchRemove } from '@/api/route'
import type { SysRoute } from '@/types'
import type { SearchForm } from '@/types/search'
import type { SaveMode } from '@/types/save'

function flattenRoutes(nodes: SysRoute[]): SysRoute[] {
  const result: SysRoute[] = []
  const walk = (list: SysRoute[]) => {
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

export default function RoutesPage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/routes')
  const saveRef = useRef<RouteSaveHandle>(null)
  const codegenRef = useRef<RouteCodegenHandle>(null)
  const [loading, setLoading] = useState(false)
  const [treeData, setTreeData] = useState<SysRoute[]>([])
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [selected, setSelected] = useState<SysRoute[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([])
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)

  const flat = useMemo(() => flattenRoutes(treeData), [treeData])
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
    if (action === 'delete' && row.builtIn) return '内置路由不可删除'
    if (action === 'generate' && row.type !== 'MENU') return '仅菜单可代码生成'
    return false
  }

  async function handleDelete(row: SysRoute) {
    if (row.builtIn) {
      message.warning('内置路由不可删除')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定删除路由「${row.title}」吗？`,
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
      message.warning('选中项包含内置路由，不可删除')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定删除选中的 ${selected.length} 条路由吗？`,
      okType: 'danger',
      onOk: async () => {
        await batchRemove(selected.map((r) => r.id))
        message.success('删除成功')
        await loadData()
      },
    })
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

  function onRowAction(action: string, row: SysRoute) {
    if (action === 'delete') void handleDelete(row)
    else if (action === 'edit' || action === 'view') openSave(action, row.id)
    else if (action === 'add-child') openSave('add', undefined, row.id)
    else if (action === 'generate') codegenRef.current?.open(row)
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      minWidth: 160,
      render: (v: string, row: SysRoute) => (
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          {row.icon ? <XnAppIcon name={row.icon} size={16} /> : null}
          {v}
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 90,
      render: (v: string) => (
        <Tag color={v === 'DIR' ? 'processing' : 'success'}>{v === 'DIR' ? '目录' : '菜单'}</Tag>
      ),
    },
    { title: '路径', dataIndex: 'path', ellipsis: true, minWidth: 140 },
    {
      title: '视图',
      dataIndex: 'viewPath',
      ellipsis: true,
      minWidth: 160,
      render: (v?: string) => (v ? `pages/${v}/` : '—'),
    },
    { title: '排序', dataIndex: 'sort', width: 70 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: number) => (
        <Tag color={v === 1 ? 'success' : 'default'}>{v === 1 ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '权限控制',
      dataIndex: 'permissionControl',
      width: 100,
      render: (v: boolean) => (v ? '开启' : '关闭'),
    },
    {
      title: '内置',
      dataIndex: 'builtIn',
      width: 70,
      render: (v: boolean) => (v ? '是' : '否'),
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right' as const,
      width: 240,
      render: (_: unknown, row: SysRoute) => (
        <XnTableActions
          items={tableButtonItems}
          row={row as unknown as Record<string, unknown>}
          disabled={tableActionDisabled}
          onActionClick={({ action, row: r }) => onRowAction(action, r as unknown as SysRoute)}
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
              <Card
                key={row.id}
                size="small"
                title={
                  <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    {row.icon ? <XnAppIcon name={row.icon} size={16} /> : null}
                    {row.title}
                  </span>
                }
              >
                <div>
                  <Tag color={row.type === 'DIR' ? 'processing' : 'success'}>
                    {row.type === 'DIR' ? '目录' : '菜单'}
                  </Tag>
                  <Tag color={row.status === 1 ? 'success' : 'default'}>
                    {row.status === 1 ? '启用' : '禁用'}
                  </Tag>
                </div>
                <div>路径：{row.path || '—'}</div>
                <div>权限控制：{row.permissionControl ? '开启' : '关闭'}</div>
                <div style={{ marginTop: 8 }}>
                  <XnTableActions
                    items={tableButtonItems}
                    row={row as unknown as Record<string, unknown>}
                    disabled={tableActionDisabled}
                    onActionClick={({ action, row: r }) =>
                      onRowAction(action, r as unknown as SysRoute)
                    }
                  />
                </div>
              </Card>
            ))}
          </div>
        }
      />
      <RouteSave ref={saveRef} onSuccess={() => void loadData()} />
      <RouteCodegen ref={codegenRef} />
    </>
  )
}
