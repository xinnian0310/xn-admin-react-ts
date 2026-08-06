import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd'
import Auth from '@/components/Auth'
import IconPicker from '@/components/IconPicker'
import { create, getMenuGroups, remove, update } from '@/api/permission'
import type { MenuPermissionGroup, Permission, PermissionForm } from '@/types'
import type { SaveMode } from '@/types/save'

interface AssignPanelProps {
  menuId: number
  menuName: string
  open: boolean
  onClose: () => void
  onChanged?: () => void
}

const BUTTON_POOL = [
  { action: 'create', name: '新增' },
  { action: 'update', name: '编辑' },
  { action: 'view', name: '查看' },
  { action: 'delete', name: '删除' },
]
const TABLE_BUTTON_POOL = [
  { action: 'table-view', name: '查看' },
  { action: 'table-edit', name: '编辑' },
  { action: 'table-delete', name: '删除' },
  { action: 'assign', name: '分配权限' },
  { action: 'add-child', name: '添加子级' },
]

export default function PermissionAssignPanel({
  menuId,
  menuName,
  open,
  onClose,
  onChanged,
}: AssignPanelProps) {
  const [group, setGroup] = useState<MenuPermissionGroup | null>(null)
  const [loading, setLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [mode, setMode] = useState<SaveMode>('add')
  const [editing, setEditing] = useState<Permission | null>(null)
  const [activeType, setActiveType] = useState<'API' | 'BUTTON' | 'TABLE_BUTTON'>('API')
  const [form] = Form.useForm<PermissionForm & { buttonAction?: string }>()

  const buttonPrefix = useMemo(() => {
    const code = group?.menuCode || ''
    return code.split(':').pop() || code
  }, [group])

  async function load() {
    setLoading(true)
    try {
      const res = await getMenuGroups(menuId)
      setGroup(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, menuId])

  function openCreate(type: 'API' | 'BUTTON' | 'TABLE_BUTTON') {
    setMode('add')
    setEditing(null)
    setActiveType(type)
    form.resetFields()
    form.setFieldsValue({
      type,
      parentId: menuId,
      sort: 0,
      method: 'GET',
      path: '',
      name: '',
      code: '',
      action: '',
      icon: '',
      buttonColor: 'primary',
    })
    setEditOpen(true)
  }

  function openEdit(row: Permission, view = false) {
    setMode(view ? 'view' : 'edit')
    setEditing(row)
    setActiveType(row.type as 'API' | 'BUTTON' | 'TABLE_BUTTON')
    form.setFieldsValue({
      ...row,
      buttonAction: row.action,
    })
    setEditOpen(true)
  }

  async function handleSubmit() {
    const values = await form.validateFields()
    const type = activeType
    let payload: PermissionForm = {
      name: values.name,
      type,
      parentId: menuId,
      sort: values.sort ?? 0,
      code: '',
    }
    if (type === 'API') {
      const method = String(values.method || 'GET').toUpperCase()
      const path = String(values.path || '').startsWith('/')
        ? String(values.path)
        : `/${values.path || ''}`
      payload = {
        ...payload,
        method,
        path,
        code: mode === 'add' ? `api:${method}:${path}` : editing!.code,
      }
    } else {
      const action = String(values.buttonAction || values.action || '')
      payload = {
        ...payload,
        action,
        icon: values.icon,
        buttonColor: values.buttonColor,
        code: mode === 'add' ? `${buttonPrefix}:${action}` : editing!.code,
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
    await load()
    onChanged?.()
  }

  function renderTable(type: 'API' | 'BUTTON' | 'TABLE_BUTTON', data: Permission[]) {
    const pool = type === 'BUTTON' ? BUTTON_POOL : type === 'TABLE_BUTTON' ? TABLE_BUTTON_POOL : []
    const existing = new Set(data.map((d) => (d.action || d.code.split(':').pop() || '').toLowerCase()))
    const canQuickAdd = pool.filter((p) => !existing.has(p.action.toLowerCase()))

    return (
      <>
        <Space style={{ marginBottom: 8 }}>
          <Auth permission="permission-content:create">
            <Button type="primary" size="small" onClick={() => openCreate(type)}>
              新增
            </Button>
          </Auth>
          {canQuickAdd.map((p) => (
            <Auth key={p.action} permission="permission-content:create">
              <Button
                size="small"
                onClick={() => {
                  openCreate(type)
                  form.setFieldsValue({
                    buttonAction: p.action,
                    action: p.action,
                    name: p.name,
                    buttonColor: p.action.includes('delete') ? 'danger' : 'primary',
                  })
                }}
              >
                +{p.name}
              </Button>
            </Auth>
          ))}
        </Space>
        <Table
          size="small"
          rowKey="id"
          loading={loading}
          dataSource={data}
          pagination={false}
          columns={[
            ...(type === 'API'
              ? [
                  { title: '方法', dataIndex: 'method', width: 90, render: (v: string) => <Tag>{v}</Tag> },
                  { title: '路径', dataIndex: 'path', ellipsis: true },
                ]
              : [
                  { title: '编码', dataIndex: 'code', ellipsis: true },
                ]),
            { title: '名称', dataIndex: 'name' },
            { title: '排序', dataIndex: 'sort', width: 70 },
            {
              title: '内置',
              dataIndex: 'builtIn',
              width: 70,
              render: (v: boolean) => (v ? '是' : '否'),
            },
            {
              title: '操作',
              width: 140,
              render: (_: unknown, row: Permission) => (
                <Space>
                  <Auth permission="permission-content:table-edit">
                    <Button type="link" size="small" onClick={() => openEdit(row)}>
                      编辑
                    </Button>
                  </Auth>
                  <Auth permission="permission-content:table-delete">
                    <Button
                      type="link"
                      size="small"
                      danger
                      disabled={row.builtIn}
                      onClick={() => {
                        Modal.confirm({
                          title: '确认删除',
                          content: `确定删除「${row.name}」吗？`,
                          okType: 'danger',
                          onOk: async () => {
                            await remove(row.id)
                            message.success('删除成功')
                            await load()
                            onChanged?.()
                          },
                        })
                      }}
                    >
                      删除
                    </Button>
                  </Auth>
                </Space>
              ),
            },
          ]}
        />
      </>
    )
  }

  return (
    <>
      <Modal
        title={`分配权限 - ${menuName}`}
        open={open}
        onCancel={onClose}
        width={920}
        footer={<Button onClick={onClose}>关闭</Button>}
        destroyOnHidden
      >
        <Tabs
          items={[
            {
              key: 'api',
              label: `接口 (${group?.api?.length || 0})`,
              children: renderTable('API', group?.api || []),
            },
            {
              key: 'button',
              label: `按钮 (${group?.button?.length || 0})`,
              children: renderTable('BUTTON', group?.button || []),
            },
            {
              key: 'table',
              label: `表格按钮 (${group?.tableButton?.length || 0})`,
              children: renderTable('TABLE_BUTTON', group?.tableButton || []),
            },
          ]}
        />
      </Modal>

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
            <span>{menuName}</span>
          </Form.Item>
          <Form.Item label="类型">
            <Tag>{activeType}</Tag>
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          {activeType === 'API' ? (
            <>
              <Form.Item name="method" label="方法" rules={[{ required: true, message: '请选择方法' }]}>
                <Select
                  disabled={Boolean(editing?.builtIn) && mode !== 'add'}
                  options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => ({ label: m, value: m }))}
                />
              </Form.Item>
              <Form.Item name="path" label="路径" rules={[{ required: true, message: '请输入路径' }]}>
                <Input disabled={Boolean(editing?.builtIn) && mode !== 'add'} placeholder="/api/xxx" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                name="buttonAction"
                label="动作"
                rules={[{ required: true, message: '请输入动作标识' }]}
                extra="前端按钮 action，如 add / edit / delete"
              >
                <Input />
              </Form.Item>
              <Form.Item name="icon" label="图标">
                <IconPicker />
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
          )}
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} max={9999} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

/** 兼容旧 assign.vue：独立入口包装 */
export function PermissionAssignDialog({
  open,
  menuId,
  menuName,
  onClose,
}: {
  open: boolean
  menuId?: number
  menuName?: string
  onClose: () => void
}) {
  if (!menuId) return null
  return (
    <PermissionAssignPanel
      open={open}
      menuId={menuId}
      menuName={menuName || ''}
      onClose={onClose}
    />
  )
}
