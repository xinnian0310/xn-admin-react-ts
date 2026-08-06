import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import { Alert, Form, Input, InputNumber, Modal, Radio, Switch, TreeSelect, message } from 'antd'
import { create, get, list, update } from '@/api/route'
import IconPicker from '@/components/IconPicker'
import { hasIndexView } from '@/utils/view-loader'
import { autoViewPath, normalizeRoutePath } from '@/utils/route-path'
import type { SysRoute, SysRouteForm } from '@/types'
import { saveDialogTitle, type SaveMode, type SaveOpenOptions } from '@/types/save'

export interface RouteSaveHandle {
  open: (mode: SaveMode, id?: number, options?: SaveOpenOptions) => Promise<void>
}

function excludeSelf(nodes: SysRoute[], selfId?: number | null): SysRoute[] {
  return nodes
    .filter((n) => n.id !== selfId)
    .map((n) => ({
      ...n,
      children: n.children?.length ? excludeSelf(n.children, selfId) : undefined,
    }))
}

type TreeOption = { title: string; value: number; children?: TreeOption[] }

function toTree(nodes: SysRoute[]): TreeOption[] {
  return nodes.map((n) => ({
    title: n.title,
    value: n.id,
    children: n.children?.length ? toTree(n.children) : undefined,
  }))
}

const RouteSave = forwardRef<RouteSaveHandle, { onSuccess?: () => void }>(function RouteSave(
  { onSuccess },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<SaveMode>('add')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [builtIn, setBuiltIn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [routeTree, setRouteTree] = useState<SysRoute[]>([])
  const [form] = Form.useForm<SysRouteForm>()
  const routeType = Form.useWatch('type', form) || 'MENU'

  const parentTree = useMemo(
    () => toTree(excludeSelf(routeTree, editingId)),
    [routeTree, editingId],
  )

  useImperativeHandle(ref, () => ({
    async open(openMode, id, options) {
      setMode(openMode)
      setEditingId(id ?? null)
      setBuiltIn(false)
      form.resetFields()
      form.setFieldsValue({
        title: '',
        type: 'MENU',
        parentId: options?.parentId ?? null,
        path: '',
        viewPath: '',
        icon: '',
        iconAntd: '',
        sort: 0,
        status: 1,
        hidden: false,
        permissionControl: true,
        affix: false,
      })
      const res = await list()
      setRouteTree(res.data || [])
      setVisible(true)
      if (openMode !== 'add' && id) {
        const detail = await get(id)
        setBuiltIn(Boolean(detail.data.builtIn))
        form.setFieldsValue({
          title: detail.data.title,
          type: detail.data.type,
          parentId: detail.data.parentId ?? null,
          path: detail.data.path || '',
          viewPath: detail.data.viewPath || '',
          icon: detail.data.icon || '',
          iconAntd: detail.data.iconAntd || '',
          sort: detail.data.sort,
          status: detail.data.status,
          hidden: detail.data.hidden,
          permissionControl: detail.data.permissionControl,
          affix: detail.data.affix,
        })
      }
    },
  }))

  function onPathBlur() {
    const path = form.getFieldValue('path')
    if (!path) return
    const normalized = normalizeRoutePath(path)
    form.setFieldsValue({
      path: normalized,
      viewPath: autoViewPath(normalized),
    })
    if (!hasIndexView(normalized)) {
      message.warning(`未找到页面 pages${normalized}/index.tsx，保存后仍可配置，需补页面文件`)
    }
  }

  async function handleSubmit() {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      const payload: SysRouteForm = {
        title: values.title,
        type: values.type,
        parentId: values.parentId ?? null,
        icon: values.icon,
        iconAntd: values.iconAntd,
        sort: values.sort ?? 0,
        status: values.status ?? 1,
        hidden: Boolean(values.hidden),
      }
      if (values.type === 'MENU') {
        const path = normalizeRoutePath(values.path || '')
        payload.path = path
        payload.viewPath = values.viewPath || autoViewPath(path)
        payload.permissionControl = Boolean(values.permissionControl)
        payload.affix = Boolean(values.affix)
      }
      if (mode === 'edit' && editingId) {
        await update(editingId, payload)
        message.success('更新成功')
      } else {
        await create(payload)
        message.success('创建成功')
      }
      setVisible(false)
      onSuccess?.()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={saveDialogTitle(mode, '路由')}
      open={visible}
      onCancel={() => setVisible(false)}
      destroyOnHidden
      width={640}
      okText="保存"
      cancelText={mode === 'view' ? '关闭' : '取消'}
      okButtonProps={{ style: mode === 'view' ? { display: 'none' } : undefined }}
      confirmLoading={submitting}
      onOk={() => void handleSubmit()}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="路径与页面目录对应：/system/roles → pages/system/roles/index.tsx；权限码由后端按规则生成。"
      />
      <Form form={form} labelCol={{ span: 5 }} disabled={mode === 'view'}>
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="type" label="类型">
          <Radio.Group
            disabled={builtIn && mode !== 'add'}
            options={[
              { label: '目录', value: 'DIR' },
              { label: '菜单', value: 'MENU' },
            ]}
          />
        </Form.Item>
        <Form.Item name="parentId" label="上级">
          <TreeSelect
            allowClear
            treeDefaultExpandAll
            placeholder="无（顶级）"
            treeData={parentTree}
          />
        </Form.Item>
        {routeType === 'MENU' ? (
          <>
            <Form.Item name="path" label="路径" rules={[{ required: true, message: '请输入路径' }]}>
              <Input placeholder="/system/roles" onBlur={onPathBlur} />
            </Form.Item>
            <Form.Item name="viewPath" label="视图目录">
              <Input disabled addonBefore="pages/" addonAfter="/index.tsx" />
            </Form.Item>
          </>
        ) : null}
        <Form.Item
          name="icon"
          label="图标(Element)"
          extra="Vue 端使用；填写 Element 图标名如 Setting"
        >
          <IconPicker placeholder="Setting / mdi:cog" />
        </Form.Item>
        <Form.Item
          name="iconAntd"
          label="图标(Ant)"
          extra="React 端优先使用；建议 Iconify，如 mdi:cog"
        >
          <IconPicker placeholder="mdi:home / antd:SettingOutlined" />
        </Form.Item>
        <Form.Item name="sort" label="排序">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Radio.Group
            options={[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]}
          />
        </Form.Item>
        <Form.Item name="hidden" label="隐藏" valuePropName="checked">
          <Switch />
        </Form.Item>
        {routeType === 'MENU' ? (
          <>
            <Form.Item
              name="permissionControl"
              label="权限控制"
              valuePropName="checked"
              extra="开启后该菜单参与 RBAC，并可挂载按钮/接口权限"
            >
              <Switch />
            </Form.Item>
            <Form.Item name="affix" label="固定标签" valuePropName="checked">
              <Switch />
            </Form.Item>
          </>
        ) : null}
      </Form>
    </Modal>
  )
})

export default RouteSave
