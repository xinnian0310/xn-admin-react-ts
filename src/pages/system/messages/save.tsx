import XnModal from '@/components/XnModal'
﻿import { forwardRef, useImperativeHandle, useState } from 'react'
import { Form, Input, message } from 'antd'
import XnRichEditor from '@/components/XnRichEditor'
import { create, get, update } from '@/api/message'
import type { MessageForm } from '@/types'
import { saveDialogTitle, type SaveMode } from '@/types/save'

export interface MessageSaveHandle {
  open: (mode: SaveMode, id?: number) => Promise<void>
}

interface Props {
  onSuccess?: () => void
}

const MessageSave = forwardRef<MessageSaveHandle, Props>(function MessageSave({ onSuccess }, ref) {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<SaveMode>('add')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<MessageForm>()

  useImperativeHandle(ref, () => ({
    async open(nextMode, id) {
      setMode(nextMode)
      setEditingId(id ?? null)
      form.resetFields()
      form.setFieldsValue({ title: '', content: '' })
      setVisible(true)
      if (id) {
        const res = await get(id)
        form.setFieldsValue({ title: res.data.title, content: res.data.content })
      }
    },
  }))

  async function handleSubmit() {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      const payload = { title: values.title.trim(), content: values.content }
      if (editingId) {
        await update(editingId, payload)
        message.success('更新成功')
      } else {
        await create(payload)
        message.success('保存成功')
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
      title={saveDialogTitle(mode, '站内信')}
      open={visible}
      width={820}
      destroyOnHidden
      onCancel={() => setVisible(false)}
      onOk={() => void handleSubmit()}
      okText="保存草稿"
      cancelText={readonly ? '关闭' : '取消'}
      okButtonProps={{ style: readonly ? { display: 'none' } : undefined }}
      confirmLoading={submitting}
    >
      <Form form={form} labelCol={{ span: 3 }} disabled={readonly} style={{ marginTop: 16 }}>
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input maxLength={200} showCount placeholder="请输入标题" />
        </Form.Item>
        <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
          <XnRichEditor disabled={readonly} height="360px" placeholder="请输入消息内容" />
        </Form.Item>
      </Form>
    </XnModal>
  )
})

export default MessageSave

