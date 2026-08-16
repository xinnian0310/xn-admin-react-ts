import { forwardRef, useImperativeHandle, useState } from 'react'
import { Form, Input, Upload, Image, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import { uploadDonationQrcode } from '@/api/site-contact'
import { saveDialogTitle, type SaveMode } from '@/types/save'
import type { SiteDonationQrcode } from '@/types/site-contact'
import XnModal from '@/components/XnModal'

export interface QrcodeSaveHandle {
  open: (mode: SaveMode, row?: SiteDonationQrcode, index?: number) => void
}

interface Props {
  onSuccess?: (payload: { mode: SaveMode; index: number | null; data: SiteDonationQrcode }) => void
}

const QrcodeSave = forwardRef<QrcodeSaveHandle, Props>(function QrcodeSave({ onSuccess }, ref) {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<SaveMode>('add')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [form] = Form.useForm<SiteDonationQrcode>()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const src = Form.useWatch('src', form)

  function syncFileList(url: string) {
    if (!url) {
      setFileList([])
      return
    }
    setFileList([{ uid: String(Date.now()), name: 'donation-qrcode', status: 'done', url }])
  }

  useImperativeHandle(ref, () => ({
    open(openMode, row, index) {
      setMode(openMode)
      setEditingIndex(index ?? null)
      form.resetFields()
      form.setFieldsValue({ label: row?.label || '', src: row?.src || '' })
      syncFileList(row?.src || '')
      setVisible(true)
    },
  }))

  async function handleSubmit() {
    const values = await form.validateFields()
    onSuccess?.({
      mode,
      index: editingIndex,
      data: { label: values.label.trim(), src: values.src.trim() },
    })
    setVisible(false)
  }

  const readonly = mode === 'view'

  return (
    <>
      <XnModal
        title={saveDialogTitle(mode, '捐赠二维码')}
        open={visible}
        width={480}
        destroyOnHidden
        onCancel={() => setVisible(false)}
        onOk={() => void handleSubmit()}
        okText="确定"
        cancelText={readonly ? '关闭' : '取消'}
        okButtonProps={{ style: readonly ? { display: 'none' } : undefined }}
        confirmLoading={uploading}
      >
        <Form form={form} labelCol={{ span: 5 }} disabled={readonly} style={{ marginTop: 16 }}>
          <Form.Item name="label" label="名称">
            <Input disabled />
          </Form.Item>
          <div style={{ margin: '-8px 0 16px 20.8%', fontSize: 12, color: '#94a3b8' }}>
            名称固定，仅可更换二维码图片
          </div>
          <Form.Item
            name="src"
            label="二维码"
            rules={[{ required: true, message: '请上传二维码图片' }]}
          >
            <Input type="hidden" />
          </Form.Item>
          <div style={{ marginLeft: '20.8%' }}>
            <Upload
              listType="picture-card"
              accept="image/png,image/jpeg,image/webp"
              fileList={fileList}
              disabled={readonly || uploading}
              maxCount={1}
              onPreview={() => {
                if (src) setPreviewOpen(true)
              }}
              onRemove={() => {
                form.setFieldValue('src', '')
                setFileList([])
              }}
              customRequest={async (opt) => {
                setUploading(true)
                try {
                  const res = await uploadDonationQrcode(opt.file as File)
                  form.setFieldValue('src', res.data.url)
                  syncFileList(res.data.url)
                  message.success('上传成功')
                  opt.onSuccess?.(res)
                } catch (e: unknown) {
                  form.setFieldValue('src', '')
                  setFileList([])
                  message.error(e instanceof Error ? e.message : '上传失败')
                  opt.onError?.(e as Error)
                } finally {
                  setUploading(false)
                }
              }}
              onChange={({ fileList: fl }) => {
                if (fl.length > 1) message.warning('仅允许上传一张二维码图片')
              }}
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <PlusOutlined />
                </div>
              )}
            </Upload>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              仅可上传 1 张，支持 png / jpg / webp，建议正方形清晰图
            </div>
          </div>
        </Form>
      </XnModal>
      <Image
        style={{ display: 'none' }}
        preview={{
          visible: previewOpen,
          src: src || '',
          onVisibleChange: (v) => setPreviewOpen(v),
        }}
      />
    </>
  )
})

export default QrcodeSave
