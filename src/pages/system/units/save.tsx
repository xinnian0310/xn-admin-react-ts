import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import { Form, Input, InputNumber, Modal, Radio, Select, TreeSelect, message } from 'antd'
import { create, get, list, update } from '@/api/unit'
import { getOptions as getRoleOptions } from '@/api/role'
import { usePermission } from '@/hooks/usePermission'
import type { Role, SysUnit, SysUnitForm } from '@/types'
import { saveDialogTitle, type SaveMode, type SaveOpenOptions } from '@/types/save'

export interface UnitSaveHandle {
  open: (mode: SaveMode, id?: number, options?: SaveOpenOptions) => Promise<void>
}

function excludeSelf(nodes: SysUnit[], selfId?: number | null): SysUnit[] {
  return nodes
    .filter((n) => n.id !== selfId)
    .map((n) => ({
      ...n,
      children: n.children?.length ? excludeSelf(n.children, selfId) : undefined,
    }))
}

type TreeOption = { title: string; value: number; children?: TreeOption[] }

function toTreeData(nodes: SysUnit[]): TreeOption[] {
  return nodes.map((n) => ({
    title: n.name,
    value: n.id,
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }))
}

const UnitSave = forwardRef<UnitSaveHandle, { onSuccess?: () => void }>(function UnitSave(
  { onSuccess },
  ref,
) {
  const { isSuperAdmin } = usePermission()
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<SaveMode>('add')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [builtIn, setBuiltIn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [roleOptions, setRoleOptions] = useState<Role[]>([])
  const [unitTree, setUnitTree] = useState<SysUnit[]>([])
  const [form] = Form.useForm<SysUnitForm>()

  const availableRoles = useMemo(
    () => (isSuperAdmin() ? roleOptions : roleOptions.filter((r) => r.code !== 'SUPER_ADMIN')),
    [isSuperAdmin, roleOptions],
  )

  const parentTree = useMemo(
    () => toTreeData(excludeSelf(unitTree, editingId)),
    [unitTree, editingId],
  )

  useImperativeHandle(ref, () => ({
    async open(openMode, id, options) {
      setMode(openMode)
      setEditingId(id ?? null)
      setBuiltIn(false)
      form.resetFields()
      form.setFieldsValue({
        name: '',
        code: '',
        parentId: options?.parentId ?? null,
        roleIds: [],
        sort: 0,
        status: 1,
        description: '',
      })
      const [rolesRes, treeRes] = await Promise.all([getRoleOptions(), list()])
      setRoleOptions(rolesRes.data || [])
      setUnitTree(treeRes.data || [])
      setVisible(true)
      if (openMode !== 'add' && id) {
        const res = await get(id)
        setBuiltIn(Boolean(res.data.builtIn))
        form.setFieldsValue({
          name: res.data.name,
          code: res.data.code,
          parentId: res.data.parentId ?? null,
          roleIds: res.data.roleIds || (res.data.roleList || []).map((r) => r.id),
          sort: res.data.sort,
          status: res.data.status,
          description: res.data.description || '',
        })
      }
    },
  }))

  async function handleSubmit() {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      const payload: SysUnitForm = {
        ...values,
        parentId: values.parentId ?? null,
        roleIds: values.roleIds || [],
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

  const lockBuiltIn = builtIn && mode !== 'add'

  return (
    <Modal
      title={saveDialogTitle(mode, '单位')}
      open={visible}
      onCancel={() => setVisible(false)}
      destroyOnHidden
      width={560}
      okText="保存"
      cancelText={mode === 'view' ? '关闭' : '取消'}
      okButtonProps={{ style: mode === 'view' ? { display: 'none' } : undefined }}
      confirmLoading={submitting}
      onOk={() => void handleSubmit()}
    >
      <Form form={form} labelCol={{ span: 5 }} disabled={mode === 'view'}>
        <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input disabled={lockBuiltIn} />
        </Form.Item>
        <Form.Item name="code" label="编码" rules={[{ required: true, message: '请输入编码' }]}>
          <Input disabled={lockBuiltIn} />
        </Form.Item>
        <Form.Item name="parentId" label="上级单位">
          <TreeSelect
            allowClear
            treeDefaultExpandAll
            placeholder="无（顶级）"
            treeData={parentTree}
            disabled={lockBuiltIn}
          />
        </Form.Item>
        <Form.Item name="roleIds" label="默认角色" extra="单位下用户自动继承这些角色">
          <Select
            mode="multiple"
            allowClear
            showSearch
            optionFilterProp="label"
            options={availableRoles.map((r) => ({ label: r.name, value: r.id }))}
          />
        </Form.Item>
        <Form.Item name="sort" label="排序">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Radio.Group
            disabled={lockBuiltIn}
            options={[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]}
          />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  )
})

export default UnitSave
