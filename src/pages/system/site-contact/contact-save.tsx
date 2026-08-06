import { forwardRef, useImperativeHandle, useState } from 'react'
import { Button, Form, Input, Modal, Select, Space, Switch, message } from 'antd'
import XnAppIcon from '@/components/XnAppIcon'
import { saveDialogTitle, type SaveMode } from '@/types/save'
import {
  SITE_CONTACT_TYPE_OPTIONS,
  resolveContactType,
  type SiteContactGroup,
  type SiteContactItem,
  type SiteContactType,
} from '@/types/site-contact'

export interface ContactSaveHandle {
  open: (mode: SaveMode, row?: SiteContactItem, index?: number) => void
}

interface Props {
  onSuccess?: (payload: { mode: SaveMode; index: number | null; data: SiteContactItem }) => void
}

interface ContactForm {
  icon: string
  label: string
  type: SiteContactType
  value: string
  link: string
  groups: SiteContactGroup[]
}

const ContactSave = forwardRef<ContactSaveHandle, Props>(function ContactSave({ onSuccess }, ref) {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<SaveMode>('add')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [form] = Form.useForm<ContactForm>()
  const type = Form.useWatch('type', form) || 'text'
  const groups = Form.useWatch('groups', form) || [{ value: '', full: false }]
  const icon = Form.useWatch('icon', form)

  useImperativeHandle(ref, () => ({
    open(openMode, row, index) {
      setMode(openMode)
      setEditingIndex(index ?? null)
      form.resetFields()
      if (row) {
        const nextType = resolveContactType(row)
        let nextGroups: SiteContactGroup[] = [{ value: '', full: false }]
        if (nextType === 'qq') {
          const fromGroups = (row.groups ?? [])
            .filter((g) => g.value?.trim())
            .map((g) => ({ value: g.value.trim(), full: Boolean(g.full) }))
          nextGroups = fromGroups.length
            ? fromGroups
            : row.value?.trim()
              ? [{ value: row.value.trim(), full: false }]
              : [{ value: '', full: false }]
        }
        form.setFieldsValue({
          icon: row.icon || 'Link',
          label: row.label || '',
          type: nextType,
          value: row.value || '',
          link: row.link || '',
          groups: nextGroups,
        })
      } else {
        form.setFieldsValue({
          icon: 'Link',
          label: '',
          type: 'text',
          value: '',
          link: '',
          groups: [{ value: '', full: false }],
        })
      }
      setVisible(true)
    },
  }))

  function buildData(): SiteContactItem | null {
    const values = form.getFieldsValue()
    const nextType = values.type
    const base = {
      icon: values.icon || 'Link',
      label: values.label,
      type: nextType,
    }
    if (nextType === 'qq') {
      const cleaned = (values.groups || [])
        .map((g) => ({ value: g.value.trim(), full: Boolean(g.full) }))
        .filter((g) => g.value)
      if (!cleaned.length) {
        message.warning('请至少填写一个群号')
        return null
      }
      return { ...base, value: cleaned[0].value, link: null, groups: cleaned }
    }
    if (nextType === 'email') {
      const email = values.value.trim()
      return { ...base, value: email, link: `mailto:${email}`, groups: undefined }
    }
    if (nextType === 'link') {
      return {
        ...base,
        value: values.value.trim(),
        link: values.link.trim(),
        groups: undefined,
      }
    }
    return {
      ...base,
      value: values.value.trim(),
      link: null,
      groups: undefined,
    }
  }

  async function handleSubmit() {
    if (type === 'qq') {
      const data = buildData()
      if (!data) return
      onSuccess?.({ mode, index: editingIndex, data })
      setVisible(false)
      return
    }
    await form.validateFields()
    const data = buildData()
    if (!data) return
    onSuccess?.({ mode, index: editingIndex, data })
    setVisible(false)
  }

  const readonly = mode === 'view'

  return (
    <Modal
      title={saveDialogTitle(mode, '联系项')}
      open={visible}
      width={580}
      destroyOnHidden
      onCancel={() => setVisible(false)}
      onOk={() => void handleSubmit()}
      okText="确定"
      cancelText={readonly ? '关闭' : '取消'}
      okButtonProps={{ style: readonly ? { display: 'none' } : undefined }}
    >
      <Form form={form} labelCol={{ span: 4 }} disabled={readonly} style={{ marginTop: 16 }}>
        <Form.Item label="图标">
          <Space>
            {icon ? <XnAppIcon name={icon} /> : null}
            <span>{icon || '—'}</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>固定项，不可修改</span>
          </Space>
        </Form.Item>
        <Form.Item name="icon" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="label" label="标签">
          <Input disabled />
        </Form.Item>
        <Form.Item name="type" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
          <Select options={SITE_CONTACT_TYPE_OPTIONS} />
        </Form.Item>

        {type === 'text' ? (
          <Form.Item name="value" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <Input maxLength={200} placeholder="展示文案" />
          </Form.Item>
        ) : null}

        {type === 'link' ? (
          <>
            <Form.Item name="value" label="文案" rules={[{ required: true, message: '请输入展示文案' }]}>
              <Input maxLength={200} placeholder="链接展示文字" />
            </Form.Item>
            <Form.Item
              name="link"
              label="链接"
              rules={[
                { required: true, message: '请输入链接地址' },
                {
                  validator: async (_, v) => {
                    const s = String(v || '').trim()
                    if (!/^https?:\/\//i.test(s)) throw new Error('链接需以 http:// 或 https:// 开头')
                  },
                },
              ]}
            >
              <Input maxLength={300} placeholder="https://..." />
            </Form.Item>
            <div style={{ margin: '-8px 0 16px 16.6%', fontSize: 12, color: '#94a3b8' }}>
              前台点击文案后跳转到该地址
            </div>
          </>
        ) : null}

        {type === 'email' ? (
          <>
            <Form.Item
              name="value"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '邮箱格式不正确' },
              ]}
            >
              <Input maxLength={200} placeholder="name@example.com" />
            </Form.Item>
            <div style={{ margin: '-8px 0 16px 16.6%', fontSize: 12, color: '#94a3b8' }}>
              保存后自动生成 mailto: 链接，前台可点击发信
            </div>
          </>
        ) : null}

        {type === 'qq' ? (
          <Form.Item label="群号" required>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              {groups.map((_, idx) => (
                <Space key={idx} style={{ width: '100%' }} align="center">
                  <XnAppIcon name="ri:qq-fill" size={18} />
                  <Form.Item name={['groups', idx, 'value']} noStyle>
                    <Input maxLength={30} placeholder="QQ 群号" disabled={readonly} style={{ width: 180 }} />
                  </Form.Item>
                  <Form.Item name={['groups', idx, 'full']} noStyle valuePropName="checked">
                    <Switch checkedChildren="已满" unCheckedChildren="可加" disabled={readonly} />
                  </Form.Item>
                  {!readonly ? (
                    <Button
                      type="link"
                      danger
                      disabled={groups.length <= 1}
                      onClick={() => {
                        const next = [...groups]
                        next.splice(idx, 1)
                        form.setFieldValue('groups', next)
                      }}
                    >
                      删除
                    </Button>
                  ) : null}
                </Space>
              ))}
              {!readonly ? (
                <Button
                  type="link"
                  onClick={() => form.setFieldValue('groups', [...groups, { value: '', full: false }])}
                >
                  + 添加群号
                </Button>
              ) : null}
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                打开「已满」后，前台对该群号显示删除线并标注已满
              </div>
            </div>
          </Form.Item>
        ) : null}
      </Form>
    </Modal>
  )
})

export default ContactSave
