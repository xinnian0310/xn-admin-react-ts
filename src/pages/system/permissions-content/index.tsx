import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Empty, Form, Input, InputNumber, Radio, Select, Tag, message } from 'antd'
import XnAppIcon from '@/components/XnAppIcon'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnIconPicker from '@/components/XnIconPicker'
import XnModal from '@/components/XnModal'
import XnPageLayout from '@/components/XnPageLayout'
import XnTable from '@/components/XnTable'
import XnTreePanel from '@/components/XnTreePanel'
import { usePageUi } from '@/hooks/usePageUi'
import { create, list as listPermissions, remove, update } from '@/api/permission'
import { list as listRoutes } from '@/api/route'
import type { Permission, PermissionForm, SysRoute } from '@/types'
import type { SearchForm } from '@/types/search'
import type { SaveMode } from '@/types/save'
import type { TableColumnItem } from '@/types/table'

type ContentType = 'BUTTON' | 'TABLE_BUTTON' | 'API'

const typeOptions: { label: string; value: ContentType }[] = [
  { label: '按钮权限', value: 'BUTTON' },
  { label: '表格按钮', value: 'TABLE_BUTTON' },
  { label: '接口权限', value: 'API' },
]

function typeLabel(type: string) {
  return typeOptions.find((t) => t.value === type)?.label ?? type
}

/** 与 XnButton 保持一致的按钮配色映射，用于表格内的按钮预览 */
const BUTTON_COLOR_MAP: Record<string, 'primary' | 'default'> = {
  primary: 'primary',
  success: 'primary',
  danger: 'primary',
  warning: 'default',
  info: 'default',
  default: 'default',
}

function methodTagColor(method: string) {
  switch (method) {
    case 'GET':
      return 'success'
    case 'POST':
      return 'processing'
    case 'PUT':
      return 'warning'
    case 'DELETE':
      return 'error'
    default:
      return 'default'
  }
}

function sortBySort<T extends { sort?: number }>(list: T[]) {
  return [...list].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
}

function indexPermissions(nodes: Permission[]) {
  const byCode = new Map<string, Permission>()
  const byId = new Map<number, Permission>()
  const walk = (list: Permission[]) => {
    for (const n of list) {
      byCode.set(n.code, n)
      byId.set(n.id, n)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return { byCode, byId }
}

function nameToAction(name: string): { action?: string; color?: string } {
  if (name.includes('新增') || name.includes('添加')) return { action: 'add' }
  if (name.includes('编辑') || name.includes('修改')) return { action: 'edit' }
  if (name.includes('查看') || name.includes('详情')) return { action: 'view' }
  if (name.includes('删除')) return { action: 'delete', color: 'danger' }
  if (name.includes('分配')) return { action: 'assign' }
  if (name.includes('子级')) return { action: 'add-child' }
  return {}
}

function remapTableAction(action: string) {
  if (action === 'edit' || action === 'update') return 'table-edit'
  if (action === 'view') return 'table-view'
  if (action === 'delete') return 'table-delete'
  if (action === 'add' || action === 'create') return 'table-add'
  return action
}

interface MenuNode extends Record<string, unknown> {
  id: number
  name: string
  disabled: boolean
  children: MenuNode[]
  raw: SysRoute
}

export default function PermissionsContentPage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/permissions-content')
  const [routes, setRoutes] = useState<SysRoute[]>([])
  const [permByCode, setPermByCode] = useState<Map<string, Permission>>(new Map())
  const [selectedRoute, setSelectedRoute] = useState<SysRoute | null>(null)
  const [menuKeyword, setMenuKeyword] = useState('')
  const [selectedMenuPerm, setSelectedMenuPerm] = useState<Permission | null>(null)
  const [contentType, setContentType] = useState<ContentType>('BUTTON')
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [mode, setMode] = useState<SaveMode>('add')
  const [editing, setEditing] = useState<Permission | null>(null)
  const [form] = Form.useForm<PermissionForm>()
  /** 新增时类型可在弹框内切换，决定展示动作字段还是接口字段 */
  const formType = (Form.useWatch('type', form) || contentType) as ContentType

  async function loadAll() {
    setLoading(true)
    try {
      const [routesRes, permsRes] = await Promise.all([listRoutes(), listPermissions()])
      setRoutes(routesRes.data || [])
      const { byCode } = indexPermissions(permsRes.data || [])
      setPermByCode(byCode)
      if (selectedRoute?.permission) {
        setSelectedMenuPerm(byCode.get(selectedRoute.permission) || null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** 仅已开启权限控制的菜单可选，其余置灰 */
  const menuNodes = useMemo(() => {
    const map = (list: SysRoute[]): MenuNode[] =>
      sortBySort(list).map((r) => ({
        id: r.id,
        name: r.title,
        disabled: !(r.type === 'MENU' && r.permissionControl),
        children: r.children?.length ? map(r.children) : [],
        raw: r,
      }))
    return map(routes)
  }, [routes])

  const children = useMemo(() => {
    const list = (selectedMenuPerm?.children || []).filter((c) => c.type === contentType)
    const kw = String(queryForm.FuzzyWord ?? '')
      .trim()
      .toLowerCase()
    const filtered = !kw
      ? list
      : list.filter(
          (c) =>
            c.name.toLowerCase().includes(kw) ||
            c.code.toLowerCase().includes(kw) ||
            (c.action || '').toLowerCase().includes(kw) ||
            (c.path || '').toLowerCase().includes(kw),
        )
    return sortBySort(filtered)
  }, [selectedMenuPerm, contentType, queryForm])

  const pageData = useMemo(() => {
    const start = (page - 1) * size
    return children.slice(start, start + size)
  }, [children, page, size])

  const counts = useMemo(() => {
    const list = selectedMenuPerm?.children || []
    return {
      BUTTON: list.filter((c) => c.type === 'BUTTON').length,
      TABLE_BUTTON: list.filter((c) => c.type === 'TABLE_BUTTON').length,
      API: list.filter((c) => c.type === 'API').length,
    }
  }, [selectedMenuPerm])

  const toolbarButtons = useMemo(
    () =>
      buttonItems.filter((b) => {
        const action = b.action || b.name
        return action === 'add' || action === 'create'
      }),
    [buttonItems],
  )

  /** 当前菜单下指定类型的下一个排序（max + 1，至少为 1） */
  function nextSort(type: ContentType) {
    const list = (selectedMenuPerm?.children || []).filter((c) => c.type === type)
    if (!list.length) return 1
    return Math.max(...list.map((item) => item.sort ?? 0)) + 1
  }

  // 新增弹框内切换类型时，同步排序为该类型的下一个值
  useEffect(() => {
    if (!editOpen || mode !== 'add') return
    form.setFieldValue('sort', nextSort(formType))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formType, editOpen, mode])

  function selectRoute(route: SysRoute) {
    setSelectedRoute(route)
    setSelectedMenuPerm(route.permission ? permByCode.get(route.permission) || null : null)
    setPage(1)
  }

  function openCreate() {
    if (!selectedMenuPerm) {
      message.warning('请先选择已控权的菜单')
      return
    }
    setMode('add')
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      type: contentType,
      parentId: selectedMenuPerm.id,
      sort: nextSort(contentType),
      method: 'GET',
      path: '',
      name: '',
      action: '',
      iconAntd: '',
      buttonColor: 'primary',
    })
    setEditOpen(true)
  }

  function openEdit(row: Permission, view = false) {
    setMode(view ? 'view' : 'edit')
    setEditing(row)
    form.setFieldsValue({ ...row })
    setEditOpen(true)
  }

  async function handleSubmit() {
    if (!selectedMenuPerm) return
    const values = await form.validateFields()
    const type = (editing?.type || values.type || contentType) as ContentType
    const menuPrefix = selectedMenuPerm.code.split(':').pop() || selectedMenuPerm.code
    let payload: PermissionForm = {
      name: values.name,
      type,
      parentId: selectedMenuPerm.id,
      sort: values.sort ?? 0,
      code: '',
    }

    if (type === 'API') {
      const method = String(values.method || 'GET').toUpperCase()
      let path = String(values.path || '')
      if (path && !path.startsWith('/')) path = `/${path}`
      payload = {
        ...payload,
        method,
        path,
        code: mode === 'add' ? `api:${method}:${path}` : editing!.code,
      }
    } else {
      let action = String(values.action || '')
      if (!action) {
        const guessed = nameToAction(values.name)
        action = guessed.action || ''
        if (guessed.color) payload.buttonColor = guessed.color
      }
      if (type === 'TABLE_BUTTON') action = remapTableAction(action)
      payload = {
        ...payload,
        action,
        // 表单不再维护 Element 图标，编辑时保留原值避免清空 Vue 端
        icon: editing?.icon,
        iconAntd: values.iconAntd,
        buttonColor: values.buttonColor || payload.buttonColor,
        code: mode === 'add' ? `${menuPrefix}:${action}` : editing!.code,
      }
    }

    if (mode === 'edit' && editing) {
      await update(editing.id, payload)
      message.success('更新成功')
    } else {
      await create(payload)
      message.success('创建成功')
      setContentType(type)
      setPage(1)
    }
    setEditOpen(false)
    await loadAll()
  }

  const columns: TableColumnItem[] = [
    { prop: 'name', label: '名称', minWidth: 150 },
    ...(contentType !== 'API'
      ? ([
          { type: 'slot', slot: 'icon', prop: 'icon', label: '图标', width: 70 },
          { type: 'slot', slot: 'action', prop: 'action', label: '动作', minWidth: 110 },
          {
            type: 'slot',
            slot: 'buttonColor',
            prop: 'buttonColor',
            label: '按钮颜色',
            minWidth: 100,
          },
        ] as TableColumnItem[])
      : []),
    { type: 'slot', slot: 'code', prop: 'code', label: '权限编码', minWidth: 240 },
    ...(contentType === 'API'
      ? ([
          { type: 'slot', slot: 'method', prop: 'method', label: '方法', width: 90 },
          { type: 'slot', slot: 'path', prop: 'path', label: '接口路径', minWidth: 220 },
        ] as TableColumnItem[])
      : []),
    { prop: 'sort', label: '排序', width: 80 },
    { type: 'slot', slot: 'builtIn', prop: 'builtIn', label: '内置', width: 80 },
    { type: 'slot', slot: 'actions', label: '操作', width: 140, fixed: 'right' },
  ]

  const tableSlots = {
    icon: ({ row }: { row: Record<string, unknown> }) =>
      row.iconAntd || row.icon ? (
        <XnAppIcon name={String(row.iconAntd || row.icon)} />
      ) : (
        <span>-</span>
      ),
    action: ({ row }: { row: Record<string, unknown> }) =>
      row.action ? <code>{String(row.action)}</code> : <span>-</span>,
    code: ({ row }: { row: Record<string, unknown> }) => <code>{String(row.code ?? '')}</code>,
    path: ({ row }: { row: Record<string, unknown> }) =>
      row.path ? <code>{String(row.path)}</code> : <span>-</span>,
    method: ({ row }: { row: Record<string, unknown> }) => (
      <Tag color={methodTagColor(String(row.method ?? ''))}>{String(row.method || '-')}</Tag>
    ),
    buttonColor: ({ row }: { row: Record<string, unknown> }) =>
      row.buttonColor ? (
        <Button
          size="small"
          type={BUTTON_COLOR_MAP[String(row.buttonColor)] || 'default'}
          danger={row.buttonColor === 'danger'}
        >
          {String(row.name || '示例')}
        </Button>
      ) : (
        <span>-</span>
      ),
    builtIn: ({ row }: { row: Record<string, unknown> }) =>
      row.builtIn ? <Tag color="warning">内置</Tag> : <span>-</span>,
    actions: ({ row }: { row: Record<string, unknown> }) => (
      <XnTableActions
        items={tableButtonItems}
        row={row}
        disabled={(action, r) => (action === 'delete' && r.builtIn ? '内置权限不可删除' : false)}
        onActionClick={({ action, row: r }) => {
          const p = r as unknown as Permission
          if (action === 'delete') {
            XnModal.confirm({
              title: '确认删除',
              content: `确定删除「${p.name}」吗？`,
              okType: 'danger',
              onOk: async () => {
                await remove(p.id)
                message.success('删除成功')
                await loadAll()
              },
            })
          } else if (action === 'edit' || action === 'view') {
            openEdit(p, action === 'view')
          }
        }}
      />
    ),
  }

  return (
    <>
      <XnPageLayout
        showViewSwitch={false}
        aside={
          <XnTreePanel
            title="菜单"
            width={240}
            filter={menuKeyword}
            onFilterChange={setMenuKeyword}
            filterPlaceholder="搜索菜单名称"
            data={menuNodes}
            treeProps={{ label: 'name', children: 'children', disabled: 'disabled' }}
            currentKey={selectedRoute?.id}
            onNodeClick={(node) => selectRoute(node.raw)}
          />
        }
        search={
          <XnSearch
            searchItem={searchItems}
            onQueryForm={(form) => {
              setQueryForm(form)
              setPage(1)
            }}
            onReset={(form) => {
              setQueryForm(form)
              setPage(1)
            }}
          />
        }
        toolbar={
          <XnButton
            listItem={toolbarButtons}
            onButtonClick={(action) => {
              if (action === 'add' || action === 'create') openCreate()
            }}
          />
        }
        toolbarExtra={
          <Radio.Group
            optionType="button"
            value={contentType}
            onChange={(e) => {
              setContentType(e.target.value)
              setPage(1)
            }}
            options={[
              { label: `按钮权限 (${counts.BUTTON})`, value: 'BUTTON' },
              { label: `表格按钮 (${counts.TABLE_BUTTON})`, value: 'TABLE_BUTTON' },
              { label: `接口权限 (${counts.API})`, value: 'API' },
            ]}
          />
        }
        table={
          selectedRoute && !selectedMenuPerm ? (
            <div style={{ padding: 16 }}>
              <Alert
                type="warning"
                showIcon
                message="该菜单路由未关联权限节点，请先在路由管理中开启权限控制并生成权限。"
              />
            </div>
          ) : !selectedRoute ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Empty description="请从左侧选择一个菜单，管理其接口 / 按钮权限" />
            </div>
          ) : (
            <XnTable
              data={pageData as unknown as Record<string, unknown>[]}
              total={children.length}
              loading={loading}
              page={page}
              pageSize={size}
              tableKey="system:permissions-content"
              entityName="权限"
              nameField="name"
              columns={columns}
              actionItems={tableButtonItems}
              slots={tableSlots}
              onPageChange={(p, s) => {
                setPage(p)
                setSize(s)
              }}
            />
          )
        }
      />

      <XnModal
        title={mode === 'add' ? '新增权限' : mode === 'view' ? '查看权限' : '编辑权限'}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => void handleSubmit()}
        okButtonProps={{ style: mode === 'view' ? { display: 'none' } : undefined }}
        destroyOnHidden
        width={520}
      >
        <Form form={form} labelCol={{ span: 5 }} disabled={mode === 'view'}>
          <Form.Item label="归属菜单">
            <span>{selectedRoute?.title}</span>
          </Form.Item>
          {mode === 'add' ? (
            <Form.Item name="type" label="权限类型">
              <Radio.Group optionType="button" options={typeOptions} />
            </Form.Item>
          ) : (
            <Form.Item label="权限类型">
              <Tag>{typeLabel(editing?.type || contentType)}</Tag>
            </Form.Item>
          )}
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          {(editing?.type || formType) !== 'API' ? (
            <>
              <Form.Item
                name="action"
                label="动作"
                rules={[{ required: true, message: '请输入动作标识' }]}
                extra="前端动作标识，如 add / edit / delete / assign"
              >
                <Input />
              </Form.Item>
              <Form.Item name="iconAntd" label="图标" extra="React 端优先；Ant / Iconify / SVG">
                <XnIconPicker placeholder="选择 Ant / Iconify / SVG 图标" />
              </Form.Item>
              <Form.Item name="buttonColor" label="颜色">
                <Select
                  options={['primary', 'success', 'warning', 'danger', 'info', 'default'].map(
                    (c) => ({
                      label: c,
                      value: c,
                    }),
                  )}
                />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                name="method"
                label="方法"
                rules={[{ required: true, message: '请选择方法' }]}
              >
                <Select
                  disabled={Boolean(editing?.builtIn) && mode !== 'add'}
                  options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => ({
                    label: m,
                    value: m,
                  }))}
                />
              </Form.Item>
              <Form.Item
                name="path"
                label="路径"
                rules={[{ required: true, message: '请输入路径' }]}
              >
                <Input disabled={Boolean(editing?.builtIn) && mode !== 'add'} />
              </Form.Item>
            </>
          )}
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} max={9999} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </XnModal>
    </>
  )
}
