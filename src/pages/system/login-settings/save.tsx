import XnModal from '@/components/XnModal'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { Form, Input, Radio, Select, Switch, message } from 'antd'
import { create, get, update } from '@/api/login-page'
import type { LoginPageConfigForm } from '@/types'
import { saveDialogTitle, type SaveMode } from '@/types/save'

export interface LoginPageSaveHandle {
  open: (mode: SaveMode, id?: number) => Promise<void>
}

interface Props {
  onSuccess?: () => void
}

const LoginPageSave = forwardRef<LoginPageSaveHandle, Props>(function LoginPageSave(
  { onSuccess },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<SaveMode>('add')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<LoginPageConfigForm>()
  const captchaEnabled = Form.useWatch('captchaEnabled', form)

  useImperativeHandle(ref, () => ({
    async open(openMode, id) {
      setMode(openMode)
      setEditingId(id ?? null)
      form.resetFields()
      form.setFieldsValue({
        name: '',
        captchaEnabled: false,
        captchaType: 'IMAGE',
        status: 0,
        remark: '',
      })
      setVisible(true)
      if (openMode !== 'add' && id) {
        const res = await get(id)
        const data = res.data
        form.setFieldsValue({
          name: data.name,
          captchaEnabled: !!data.captchaEnabled,
          captchaType: data.captchaType || 'IMAGE',
          status: data.status ?? 0,
          remark: data.remark ?? '',
        })
      }
    },
  }))

  async function handleSubmit() {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      const payload: LoginPageConfigForm = {
        name: values.name.trim(),
        captchaEnabled: values.captchaEnabled,
        captchaType: values.captchaEnabled ? values.captchaType || 'IMAGE' : undefined,
        status: values.status,
        remark: values.remark?.trim() || undefined,
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

  const readonly = mode === 'view'

  return (
    <XnModal
      title={saveDialogTitle(mode, '登录页配置')}
      open={visible}
      width={560}
      destroyOnHidden
      onCancel={() => setVisible(false)}
      onOk={() => void handleSubmit()}
      okText="保存"
      cancelText={readonly ? '关闭' : '取消'}
      okButtonProps={{ style: readonly ? { display: 'none' } : undefined }}
      confirmLoading={submitting}
    >
      <Form form={form} labelCol={{ span: 6 }} disabled={readonly} style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="配置名称"
          rules={[{ required: true, message: '请输入配置名称' }]}
        >
          <Input maxLength={50} placeholder="如：默认登录页" />
        </Form.Item>
        <Form.Item name="status" label="启用状态">
          <Radio.Group
            options={[
              { label: '启用', value: 1 },
              { label: '未启用', value: 0 },
            ]}
          />
        </Form.Item>
        <div style={{ margin: '-8px 0 16px 25%', fontSize: 12, color: '#94a3b8' }}>
          同时仅允许启用一套配置；启用时会自动停用其它配置
        </div>
        <Form.Item name="captchaEnabled" label="开启验证" valuePropName="checked">
          <Switch />
        </Form.Item>
        {captchaEnabled ? (
          <Form.Item
            name="captchaType"
            label="验证类型"
            rules={[
              {
                validator: async (_, value) => {
                  if (captchaEnabled && !value) throw new Error('请选择验证类型')
                },
              },
            ]}
          >
            <Select
              options={[
                { label: '图形验证码', value: 'IMAGE' },
                { label: '滑块验证', value: 'SLIDER' },
              ]}
            />
          </Form.Item>
        ) : null}
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} maxLength={200} />
        </Form.Item>
      </Form>
    </XnModal>
  )
})

export default LoginPageSave
