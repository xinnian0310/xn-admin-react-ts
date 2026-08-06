import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Table,
  Tag,
  Tree,
  message,
} from 'antd'
import type { DataNode } from 'antd/es/tree'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import IconPicker from '@/components/IconPicker'
import { usePageUi } from '@/hooks/usePageUi'
import { create, list as listPermissions, remove, update } from '@/api/permission'
import { list as listRoutes } from '@/api/route'
import type { Permission, PermissionForm, SysRoute } from '@/types'
import type { SearchForm } from '@/types/search'
import type { SaveMode } from '@/types/save'

type ContentType = 'BUTTON' | 'TABLE_BUTTON' | 'API'

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

export default function PermissionsContentPage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/permissions-content')
  const [routes, setRoutes] = useState<SysRoute[]>([])
  const [permByCode, setPermByCode] = useState<Map<string, Permission>>(new Map())
  const [selectedRoute, setSelectedRoute] = useState<SysRoute | null>(null)
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

  const treeData: DataNode[] = useMemo(() => {
    const map = (list: SysRoute[]): DataNode[] =>
      sortBySort(list).map((r) => ({
        key: String(r.id),
        title: r.title,
        disabled: !(r.type === 'MENU' && r.permissionControl),
        children: r.children?.length ? map(r.children) : undefined,
        raw: r,
      }))
    return map(routes)
  }, [routes])

  const children = useMemo(() => {
    const list = (selectedMenuPerm?.children || []).filter((c) => c.type === contentType)
    const kw = String(queryForm.FuzzyWord ?? '').trim().toLowerCase()
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
      sort: 0,
      method: 'GET',
      path: '',
      name: '',
      action: '',
      icon: '',
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
    const type = (editing?.type || contentType) as ContentType
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
        icon: values.icon,
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
    }
    setEditOpen(false)
    await loadAll()
  }

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      render: (v: string) => <code>{v}</code>,
    },
    ...(contentType !== 'API'
      ? [
          {
            title: '图标',
            dataIndex: 'icon',
            width: 70,
            render: (v: string) => (v ? <span>{v}</span> : '—'),
          },
          { title: '动作', dataIndex: 'action', width: 120 },
          {
            title: '颜色',
            dataIndex: 'buttonColor',
            width: 100,
            render: (v: string) => (v ? <Tag>{v}</Tag> : '—'),
          },
        ]
      : [
          {
            title: '方法',
            dataIndex: 'method',
            width: 90,
            render: (v: string) => <Tag>{v}</Tag>,
          },
          {
            title: '路径',
            dataIndex: 'path',
            render: (v: string) => <code>{v}</code>,
          },
        ]),
    { title: '排序', dataIndex: 'sort', width: 70 },
    {
      title: '内置',
      dataIndex: 'builtIn',
      width: 70,
      render: (v: boolean) => (v ? '是' : '否'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_: unknown, row: Permission) => (
        <XnTableActions
          items={tableButtonItems}
          row={row as unknown as Record<string, unknown>}
          disabled={(action, r) => (action === 'delete' && r.builtIn ? '内置权限不可删除' : false)}
          onActionClick={({ action, row: r }) => {
            const p = r as unknown as Permission
            if (action === 'delete') {
              Modal.confirm({
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
    },
  ]

  return (
    <div className="page-card" style={{ display: 'flex', gap: 12, minHeight: 560 }}>
      <div style={{ width: 260, flexShrink: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>菜单</div>
        <Tree
          treeData={treeData}
          defaultExpandAll
          onSelect={(_keys, info) => {
            const raw = (info.node as DataNode & { raw?: SysRoute; disabled?: boolean }).raw
            if (!raw || info.node.disabled) return
            selectRoute(raw)
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
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
        <div style={{ margin: '12px 0', display: 'flex', justifyContent: 'space-between' }}>
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
          <XnButton
            listItem={toolbarButtons}
            onButtonClick={(action) => {
              if (action === 'add' || action === 'create') openCreate()
            }}
          />
        </div>
        {selectedRoute && !selectedMenuPerm ? (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="该菜单路由未关联权限节点，请先在路由管理中开启权限控制并生成权限。"
          />
        ) : null}
        <Table
          rowKey="id"
          loading={loading}
          dataSource={pageData}
          columns={columns}
          pagination={{
            current: page,
            pageSize: size,
            total: children.length,
            showSizeChanger: true,
            onChange: (p, s) => {
              setPage(p)
              setSize(s)
            },
          }}
        />
      </div>

      <Modal
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
          <Form.Item label="权限类型">
            <Tag>{editing?.type || contentType}</Tag>
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          {(editing?.type || contentType) !== 'API' ? (
            <>
              <Form.Item
                name="action"
                label="动作"
                rules={[{ required: true, message: '请输入动作标识' }]}
                extra="前端动作标识，如 add / edit / delete / assign"
              >
                <Input />
              </Form.Item>
              <Form.Item name="icon" label="图标(Element)" extra="Vue 端使用">
                <IconPicker placeholder="Plus / Edit" />
              </Form.Item>
              <Form.Item name="iconAntd" label="图标(Ant)" extra="React 端优先">
                <IconPicker placeholder="mdi:plus / antd:PlusOutlined" />
              </Form.Item>
              <Form.Item name="buttonColor" label="颜色">
                <Select
                  options={['primary', 'success', 'warning', 'danger', 'info', 'default'].map((c) => ({
                    label: c,
                    value: c,
                  }))}
                />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item name="method" label="方法" rules={[{ required: true, message: '请选择方法' }]}>
                <Select
                  disabled={Boolean(editing?.builtIn) && mode !== 'add'}
                  options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => ({ label: m, value: m }))}
                />
              </Form.Item>
              <Form.Item name="path" label="路径" rules={[{ required: true, message: '请输入路径' }]}>
                <Input disabled={Boolean(editing?.builtIn) && mode !== 'add'} />
              </Form.Item>
            </>
          )}
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} max={9999} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
