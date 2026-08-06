import { forwardRef, useImperativeHandle, useState } from 'react'
import { Form, Input, Modal, Select, message } from 'antd'
import { create, get, update } from '@/api/role'
import type { RoleForm } from '@/types'
import { saveDialogTitle, type SaveMode } from '@/types/save'

export interface RoleSaveHandle {
  open: (mode: SaveMode, id?: number) => Promise<void>
}

const DATA_SCOPE_OPTIONS = [
  { label: '全部数据', value: 'ALL' },
  { label: '本单位及下级', value: 'UNIT_AND_CHILDREN' },
  { label: '仅本单位', value: 'UNIT' },
  { label: '仅本人', value: 'SELF' },
]

const RoleSave = forwardRef<RoleSaveHandle, { onSuccess?: () => void }>(function RoleSave(
  { onSuccess },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<SaveMode>('add')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingBuiltIn, setEditingBuiltIn] = useState(false)
  const [editingCode, setEditingCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<RoleForm>()

  useImperativeHandle(ref, () => ({
    async open(openMode, id) {
      setMode(openMode)
      setEditingId(id ?? null)
      setEditingBuiltIn(false)
      setEditingCode('')
      form.resetFields()
      form.setFieldsValue({
        name: '',
        code: '',
        dataScope: 'UNIT_AND_CHILDREN',
        description: '',
      })
      setVisible(true)
      if (openMode !== 'add' && id) {
        const res = await get(id)
        setEditingBuiltIn(Boolean(res.data.builtIn))
        setEditingCode(res.data.code)
        form.setFieldsValue({
          name: res.data.name,
          code: res.data.code,
          dataScope:
            res.data.dataScope ||
            (res.data.code === 'SUPER_ADMIN' ? 'ALL' : 'UNIT_AND_CHILDREN'),
          description: res.data.description || '',
        })
      }
    },
  }))

  async function handleSubmit() {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      const payload: RoleForm = {
        ...values,
        dataScope: editingCode === 'SUPER_ADMIN' ? 'ALL' : values.dataScope,
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

  const lockCore = mode === 'view' || editingBuiltIn

  return (
    <Modal
      title={saveDialogTitle(mode, '角色')}
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
          <Input disabled={lockCore} />
        </Form.Item>
        <Form.Item name="code" label="编码" rules={[{ required: true, message: '请输入编码' }]}>
          <Input disabled={lockCore} />
        </Form.Item>
        <Form.Item
          name="dataScope"
          label="数据权限"
          rules={[{ required: true, message: '请选择数据权限' }]}
          extra={
            editingCode === 'SUPER_ADMIN'
              ? '超级管理员固定为全部数据'
              : '多角色取最宽范围；默认本单位及下级'
          }
        >
          <Select
            options={DATA_SCOPE_OPTIONS}
            disabled={mode === 'view' || editingCode === 'SUPER_ADMIN'}
          />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  )
})

export default RoleSave
