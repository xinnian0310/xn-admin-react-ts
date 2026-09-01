import { forwardRef, useImperativeHandle, useState } from 'react'
import { Form, Image, Input, InputNumber, Radio, Upload, message } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { PlusOutlined } from '@ant-design/icons'
import XnDialog from '@/components/XnDialog'
import {
  adminCreateProvider,
  adminListProviders,
  adminUpdateProvider,
  type ProviderForm,
} from '@/api/ai/admin'
import { uploadBrandAsset } from '@/api/system-config'
import { isImageSrc } from '@/utils/icons'
import { showCaughtError } from '@/utils/request'
import { saveDialogTitle, type SaveMode } from '@/types/save'
import './providers.scss'

export interface ProviderSaveHandle {
  open: (mode: SaveMode, id?: string) => Promise<void>
}

interface Props {
  onSuccess?: () => void
}

const ProviderSave = forwardRef<ProviderSaveHandle, Props>(function ProviderSave(
  { onSuccess },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<SaveMode>('add')
  const [editingId, setEditingId] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [iconList, setIconList] = useState<UploadFile[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [form] = Form.useForm<ProviderForm>()

  const isEdit = mode === 'edit' && !!editingId
  const isView = mode === 'view'

  function syncIconList(url = form.getFieldValue('icon') as string | undefined) {
    if (!isImageSrc(url)) {
      setIconList([])
      return
    }
    setIconList([
      {
        name: 'provider-logo',
        url,
        status: 'done',
        uid: String(Date.now()),
      },
    ])
  }

  function resetForm() {
    setEditingId('')
    form.resetFields()
    form.setFieldsValue({ name: '', code: '', baseUrl: '', icon: '', sort: 0, status: 1 })
    setIconList([])
    setPreviewOpen(false)
  }

  useImperativeHandle(ref, () => ({
    async open(openMode, id) {
      setMode(openMode)
      resetForm()
      setEditingId(id || '')
      setVisible(true)
      if (openMode !== 'add' && id) {
        const res = await adminListProviders()
        const current = (res.data ?? []).find((p) => p.id === id)
        if (!current) {
          message.error('厂商不存在')
          setVisible(false)
          return
        }
        form.setFieldsValue({
          name: current.name,
          code: current.code,
          baseUrl: current.baseUrl,
          icon: current.icon || '',
          sort: current.sort,
          status: current.status,
        })
        syncIconList(current.icon || '')
      }
    },
  }))

  async function onSave() {
    const values = await form.validateFields()
    if (!values.name || !values.code || !values.baseUrl) {
      message.warning('请填写名称、标识和 Base URL')
      return
    }
    setSaving(true)
    try {
      const payload: ProviderForm = {
        name: values.name,
        code: values.code,
        baseUrl: values.baseUrl,
        icon: values.icon,
        sort: values.sort,
        status: values.status,
      }
      if (isEdit) {
        await adminUpdateProvider(editingId, payload)
        message.success('已保存')
      } else {
        await adminCreateProvider(payload)
        message.success('已创建')
      }
      setVisible(false)
      onSuccess?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <XnDialog
        title={saveDialogTitle(mode, '厂商')}
        open={visible}
        width={620}
        destroyOnClose
        onCancel={() => setVisible(false)}
        afterClose={resetForm}
        cancelText={isView ? '关闭' : '取消'}
        showConfirm={!isView}
        confirmText="保存"
        confirmLoading={saving}
        onConfirm={() => void onSave()}
      >
        <Form form={form} labelCol={{ span: 5 }} disabled={isView} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请填写名称' }]}>
            <Input maxLength={64} />
          </Form.Item>
          <Form.Item name="code" label="标识" rules={[{ required: true, message: '请填写标识' }]}>
            <Input maxLength={32} disabled={isView || isEdit} placeholder="如 deepseek" />
          </Form.Item>
          <Form.Item label="图标">
            <Upload
              listType="picture-card"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              fileList={iconList}
              maxCount={1}
              disabled={uploading || isView}
              onPreview={(file) => {
                const url = file.url || (form.getFieldValue('icon') as string)
                if (!url) return
                form.setFieldValue('icon', url)
                setPreviewOpen(true)
              }}
              onRemove={() => {
                form.setFieldValue('icon', '')
                setIconList([])
              }}
              customRequest={async (opt) => {
                setUploading(true)
                try {
                  const res = await uploadBrandAsset(opt.file as File)
                  const url = res.data?.url
                  if (!url) throw new Error('上传失败')
                  form.setFieldValue('icon', url)
                  syncIconList(url)
                  message.success('上传成功')
                  opt.onSuccess?.(res)
                } catch (e: unknown) {
                  form.setFieldValue('icon', '')
                  setIconList([])
                  showCaughtError(e, '上传失败')
                  opt.onError?.(e as Error)
                } finally {
                  setUploading(false)
                }
              }}
              onChange={({ fileList }) => {
                if (fileList.length > 1) message.warning('仅允许上传一张图标')
              }}
            >
              {iconList.length >= 1 || isView ? null : <PlusOutlined />}
            </Upload>
            {!isView ? (
              <div className="form-tip">上传厂商 Logo，仅 1 张，支持 png / jpg / webp / svg</div>
            ) : null}
          </Form.Item>
          <Form.Item
            name="baseUrl"
            label="Base URL"
            rules={[{ required: true, message: '请填写 Base URL' }]}
          >
            <Input placeholder="https://api.example.com" />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} max={9999} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Radio.Group
              options={[
                { label: '启用', value: 1 },
                { label: '停用', value: 0 },
              ]}
            />
          </Form.Item>
        </Form>
      </XnDialog>
      {/* 脱离文档流，避免摊平到页面 flex 后把列表高度挤成 0 */}
      <div hidden>
        <Image
          preview={{
            open: previewOpen,
            src: form.getFieldValue('icon'),
            onOpenChange: (v) => setPreviewOpen(v),
          }}
        />
      </div>
    </>
  )
})

export default ProviderSave
