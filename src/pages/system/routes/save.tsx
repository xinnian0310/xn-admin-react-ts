import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import {
  Alert,
  Cascader,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Switch,
  TreeSelect,
  message,
} from 'antd'
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

/** 一级：本地页面 / 外部链接；二级仅本地页面下有目录、菜单 */
const typeOptions = [
  {
    value: 'local',
    label: '本地页面',
    children: [
      { value: 'DIR', label: '目录' },
      { value: 'MENU', label: '菜单' },
    ],
  },
  { value: 'LINK', label: '外部链接' },
]

function typeToCascaderPath(type?: SysRouteForm['type']): string[] {
  if (type === 'LINK') return ['LINK']
  if (type === 'DIR' || type === 'MENU') return ['local', type]
  return []
}

function cascaderPathToType(path: (string | number)[]): SysRouteForm['type'] | undefined {
  if (!path?.length) return undefined
  const leaf = String(path[path.length - 1])
  if (leaf === 'DIR' || leaf === 'MENU' || leaf === 'LINK') return leaf
  return undefined
}

function normalizeLinkUrl(url: string) {
  const cleaned = url.trim()
  if (!cleaned) return ''
  if (cleaned.startsWith('//')) return `https:${cleaned}`
  if (!/^[a-z][a-z0-9+.-]*:/i.test(cleaned)) return `https://${cleaned}`
  return cleaned
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

  const tipTitle = routeType === 'LINK' ? '外部链接内嵌规则' : '路径与视图对应规则'
  const tipDescription =
    routeType === 'LINK'
      ? '填写外部网址后，将在主内容区以 iframe 内嵌打开。未写协议时默认补全为 https://。系统访问路径由后端自动生成。部分站点禁止被嵌套时页面可能空白。'
      : '访问路径可写 system/roles 或 /system/roles（缺省会自动补 /），对应 pages/system/roles/index.tsx。视图目录随路径自动生成，不可编辑。菜单类型可带下级；目录仅作分组。权限标识由系统自动生成。'

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
        linkUrl: '',
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
          linkUrl: detail.data.linkUrl || '',
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

  function onTypeCascaderChange(path: (string | number)[]) {
    const type = cascaderPathToType(path)
    if (!type) return
    if (type === 'DIR') {
      form.setFieldsValue({ path: '', viewPath: '', linkUrl: '' })
    } else if (type === 'LINK') {
      // 新建时不展示路径；编辑时保留已有 path 供提交
      if (mode === 'add') {
        form.setFieldsValue({ path: '' })
      }
      form.setFieldsValue({ viewPath: '', permissionControl: false })
    } else if (type === 'MENU') {
      form.setFieldsValue({ linkUrl: '' })
      const currentPath = form.getFieldValue('path')
      if (currentPath) {
        const normalized = normalizeRoutePath(currentPath)
        form.setFieldsValue({ path: normalized, viewPath: autoViewPath(normalized) })
      }
    }
  }

  function onPathBlur() {
    const path = form.getFieldValue('path')
    if (!path) {
      form.setFieldsValue({ path: '', viewPath: '' })
      return
    }
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
      let normalizedPath: string | undefined
      if (values.type === 'MENU') {
        normalizedPath = normalizeRoutePath(values.path || '')
      } else if (values.type === 'LINK' && values.path?.trim()) {
        // 编辑时保留已有访问路径；新建由后端根据外链自动生成
        normalizedPath = normalizeRoutePath(values.path)
      }

      const viewPath =
        values.type === 'MENU' && normalizedPath ? autoViewPath(normalizedPath) : undefined
      const linkUrl = values.type === 'LINK' ? normalizeLinkUrl(values.linkUrl ?? '') : undefined

      if (values.type === 'MENU' && normalizedPath && !hasIndexView(normalizedPath)) {
        message.warning(`pages/${viewPath}/index.tsx 尚未创建，请先创建对应页面文件`)
      }

      const payload: SysRouteForm = {
        title: values.title,
        type: values.type,
        parentId: values.parentId ?? null,
        icon: values.icon,
        iconAntd: values.iconAntd,
        sort: values.sort ?? 0,
        status: values.status ?? 1,
        hidden: Boolean(values.hidden),
        path: normalizedPath,
        viewPath,
        linkUrl,
        permissionControl: values.type === 'MENU' ? Boolean(values.permissionControl) : false,
        affix:
          values.type === 'MENU' || values.type === 'LINK' ? Boolean(values.affix) : undefined,
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
        message={tipTitle}
        description={tipDescription}
      />
      <Form form={form} labelCol={{ span: 5 }} disabled={mode === 'view'}>
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="type"
          label="类型"
          rules={[{ required: true, message: '请选择类型' }]}
          getValueProps={(type: SysRouteForm['type']) => ({
            value: typeToCascaderPath(type),
          })}
          getValueFromEvent={(path: (string | number)[]) => cascaderPathToType(path)}
        >
          <Cascader
            options={typeOptions}
            expandTrigger="hover"
            placeholder="请选择类型"
            style={{ width: '100%' }}
            disabled={builtIn && mode !== 'add'}
            onChange={onTypeCascaderChange}
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
            <Form.Item
              name="path"
              label="访问路径"
              rules={[{ required: true, message: '菜单必须填写访问路径' }]}
            >
              <Input placeholder="/system/roles" onBlur={onPathBlur} />
            </Form.Item>
            <Form.Item name="viewPath" label="视图目录">
              <Input disabled addonBefore="pages/" addonAfter="/index.tsx" />
            </Form.Item>
          </>
        ) : null}
        {/* LINK 编辑时保留 path 供提交，不展示 */}
        {routeType === 'LINK' ? (
          <>
            <Form.Item name="path" hidden>
              <Input />
            </Form.Item>
            <Form.Item
              name="linkUrl"
              label="外部链接"
              rules={[{ required: true, message: '请填写外部链接' }]}
            >
              <Input placeholder="www.baidu.com 或 https://example.com" />
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
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="sort" label="排序" labelCol={{ span: 10 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="状态" labelCol={{ span: 10 }}>
              <Radio.Group
                options={[
                  { label: '启用', value: 1 },
                  { label: '禁用', value: 0 },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="hidden"
              label="隐藏菜单"
              valuePropName="checked"
              labelCol={{ span: 10 }}
            >
              <Switch />
            </Form.Item>
          </Col>
          {routeType === 'MENU' ? (
            <Col span={12}>
              <Form.Item
                name="permissionControl"
                label="权限控制"
                valuePropName="checked"
                labelCol={{ span: 10 }}
                extra="开启后需分配菜单权限"
              >
                <Switch />
              </Form.Item>
            </Col>
          ) : null}
          {routeType === 'MENU' || routeType === 'LINK' ? (
            <Col span={12}>
              <Form.Item
                name="affix"
                label="固定标签"
                valuePropName="checked"
                labelCol={{ span: 10 }}
              >
                <Switch />
              </Form.Item>
            </Col>
          ) : null}
        </Row>
      </Form>
    </Modal>
  )
})

export default RouteSave
