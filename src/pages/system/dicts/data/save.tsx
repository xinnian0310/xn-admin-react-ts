import { forwardRef, useImperativeHandle, useState } from 'react'
import { Form, Input, InputNumber, Modal, Radio, Select, Switch, Tag, message } from 'antd'
import { create, get, update } from '@/api/dict-data'
import { DICT_LIST_CLASS_OPTIONS, type DictDataForm } from '@/types'
import { saveDialogTitle, type SaveMode } from '@/types/save'

export interface DictDataSaveHandle {
  open: (mode: SaveMode, id?: number) => Promise<void>
}

interface Props {
  dictType: string
  onSuccess?: () => void
}

const TAG_COLORS: Record<string, string> = {
  primary: 'blue',
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'default',
}

const DictDataSave = forwardRef<DictDataSaveHandle, Props>(function DictDataSave(
  { dictType, onSuccess },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<SaveMode>('add')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<DictDataForm>()
  const listClass = Form.useWatch('listClass', form)
  const label = Form.useWatch('label', form)

  useImperativeHandle(ref, () => ({
    async open(openMode, id) {
      setMode(openMode)
      setEditingId(id ?? null)
      form.resetFields()
      form.setFieldsValue({
        dictType,
        label: '',
        value: '',
        sort: 0,
        status: 1,
        isDefault: false,
        listClass: '',
        remark: '',
      })
      setVisible(true)
      if (openMode !== 'add' && id) {
        const res = await get(id)
        const data = res.data
        form.setFieldsValue({
          dictType: data.dictType,
          label: data.label,
          value: data.value,
          sort: data.sort ?? 0,
          status: data.status ?? 1,
          isDefault: !!data.isDefault,
          listClass: data.listClass ?? '',
          remark: data.remark ?? '',
        })
      }
    },
  }))

  async function handleSubmit() {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      const payload: DictDataForm = { ...values, dictType }
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
  const previewColor = TAG_COLORS[listClass || ''] || undefined

  return (
    <Modal
      title={saveDialogTitle(mode, '字典数据')}
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
      <Form form={form} labelCol={{ span: 5 }} disabled={readonly} style={{ marginTop: 16 }}>
        <Form.Item name="label" label="字典标签" rules={[{ required: true, message: '请输入字典标签' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="value" label="字典键值" rules={[{ required: true, message: '请输入字典键值' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="listClass" label="标签样式">
          <Select
            allowClear
            placeholder="默认"
            options={DICT_LIST_CLASS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          />
        </Form.Item>
        <div style={{ margin: '-8px 0 16px 90px', fontSize: 12, color: '#94a3b8' }}>
          预览：<Tag color={previewColor}>{label || '示例'}</Tag>
        </div>
        <Form.Item name="sort" label="排序">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="isDefault" label="默认项" valuePropName="checked">
          <Switch />
        </Form.Item>
        <div style={{ margin: '-12px 0 16px 90px', fontSize: 12, color: '#94a3b8' }}>
          同一字典下仅一项可设为默认
        </div>
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
    </Modal>
  )
})

export default DictDataSave
