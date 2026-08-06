import { forwardRef, useImperativeHandle, useState } from 'react'
import { Form, Input, InputNumber, Modal, Radio, message } from 'antd'
import { create, get, update } from '@/api/post'
import type { PostForm } from '@/types/post'
import { saveDialogTitle, type SaveMode } from '@/types/save'

export interface PostSaveHandle {
  open: (mode: SaveMode, id?: number) => Promise<void>
}

const PostSave = forwardRef<PostSaveHandle, { onSuccess?: () => void }>(function PostSave(
  { onSuccess },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<SaveMode>('add')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [builtIn, setBuiltIn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<PostForm>()

  useImperativeHandle(ref, () => ({
    async open(openMode, id) {
      setMode(openMode)
      setEditingId(id ?? null)
      setBuiltIn(false)
      form.resetFields()
      form.setFieldsValue({ name: '', code: '', sort: 0, status: 1, remark: '' })
      setVisible(true)
      if (openMode !== 'add' && id) {
        const res = await get(id)
        setBuiltIn(Boolean(res.data.builtIn))
        form.setFieldsValue({
          name: res.data.name,
          code: res.data.code,
          sort: res.data.sort,
          status: res.data.status,
          remark: res.data.remark || '',
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

  return (
    <Modal
      title={saveDialogTitle(mode, '岗位')}
      open={visible}
      onCancel={() => setVisible(false)}
      destroyOnHidden
      width={520}
      okText="保存"
      cancelText={mode === 'view' ? '关闭' : '取消'}
      okButtonProps={{ style: mode === 'view' ? { display: 'none' } : undefined }}
      confirmLoading={submitting}
      onOk={() => void handleSubmit()}
    >
      <Form form={form} labelCol={{ span: 5 }} disabled={mode === 'view'}>
        <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input maxLength={50} />
        </Form.Item>
        <Form.Item
          name="code"
          label="编码"
          rules={[
            { required: true, message: '请输入编码' },
            { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '字母开头，仅字母数字下划线' },
          ]}
        >
          <Input maxLength={50} disabled={builtIn && mode !== 'add'} />
        </Form.Item>
        <Form.Item name="sort" label="排序">
          <InputNumber min={0} max={9999} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Radio.Group
            options={[
              { label: '启用', value: 1 },
              { label: '停用', value: 0 },
            ]}
          />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} maxLength={200} />
        </Form.Item>
      </Form>
    </Modal>
  )
})

export default PostSave
