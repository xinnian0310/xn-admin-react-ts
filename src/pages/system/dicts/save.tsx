import XnModal from '@/components/XnModal'
﻿import { forwardRef, useImperativeHandle, useState } from 'react'
import { Form, Input, Radio, message } from 'antd'
import { create, get, update } from '@/api/dict-type'
import type { DictTypeForm } from '@/types'
import { saveDialogTitle, type SaveMode } from '@/types/save'

export interface DictTypeSaveHandle {
  open: (mode: SaveMode, id?: number) => Promise<void>
}

interface Props {
  onSuccess?: () => void
}

const DictTypeSave = forwardRef<DictTypeSaveHandle, Props>(function DictTypeSave(
  { onSuccess },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<SaveMode>('add')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingBuiltIn, setEditingBuiltIn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<DictTypeForm>()

  useImperativeHandle(ref, () => ({
    async open(openMode, id) {
      setMode(openMode)
      setEditingId(id ?? null)
      setEditingBuiltIn(false)
      form.resetFields()
      form.setFieldsValue({ name: '', type: '', status: 1, remark: '' })
      setVisible(true)
      if (openMode !== 'add' && id) {
        const res = await get(id)
        const data = res.data
        setEditingBuiltIn(!!data.builtIn)
        form.setFieldsValue({
          name: data.name,
          type: data.type,
          status: data.status ?? 1,
          remark: data.remark ?? '',
        })
      }
    },
  }))

  async function handleSubmit() {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      if (mode === 'edit' && editingId) {
        await update(editingId, values)
        message.success('更新成功')
      } else {
        await create(values)
        message.success('创建成功')
      }
      setVisible(false)
      onSuccess?.()
    } finally {
      setSubmitting(false)
    }
  }

  const readonly = mode === 'view'

  return (
    <XnModal
      title={saveDialogTitle(mode, '字典')}
      open={visible}
      width={520}
      destroyOnHidden
      onCancel={() => setVisible(false)}
      onOk={() => void handleSubmit()}
      okText="保存"
      cancelText={readonly ? '关闭' : '取消'}
      okButtonProps={{ style: readonly ? { display: 'none' } : undefined }}
      confirmLoading={submitting}
    >
      <Form form={form} labelCol={{ span: 5 }} disabled={readonly} style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="字典名称"
          rules={[{ required: true, message: '请输入字典名称' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="type"
          label="字典编码"
          rules={[
            { required: true, message: '请输入字典编码' },
            {
              pattern: /^[a-z][a-z0-9_]*$/,
              message: '需以小写字母开头，只能包含小写字母、数字、下划线',
            },
          ]}
        >
          <Input disabled={readonly || editingBuiltIn} placeholder="如 sys_common_status" />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Radio.Group
            options={[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]}
          />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </XnModal>
  )
})

export default DictTypeSave

