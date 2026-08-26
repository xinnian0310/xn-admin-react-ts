import XnDialog from '@/components/XnDialog'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Button, Form, Input, Typography, message } from 'antd'
import XnRichEditor from '@/components/XnRichEditor'
import XnUpload, { type XnUploadHandle } from '@/components/XnUpload'
import { create, get, update } from '@/api/message'
import { resolveAttachmentUrl } from '@/config/app'
import { openKkFileViewPreview } from '@/utils/kk-file-view'
import type { AttachmentItem, FileInfo, MessageForm } from '@/types'
import { saveDialogTitle, type SaveMode } from '@/types/save'
import type { UploadTaskSnapshot } from '@/utils/upload/types'
import {
  ATTACHMENT_LIST_MAX_HEIGHT,
  ATTACHMENT_ROW_HEIGHT,
  MAX_ATTACHMENT_COUNT,
  MAX_ATTACHMENT_SIZE,
  insertAttachmentByOrder,
  resolveAttachments,
  seedAttachmentOrders,
  toAttachmentItem,
  toAttachmentPayload,
} from '@/utils/attachment'
import { formatBytes } from '@/utils/upload/format'
import { formatDateTime } from '@/utils/datetime'

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
  const uploaderRef = useRef<XnUploadHandle>(null)
  const pathOrderRef = useRef(new Map<string, number>())
  const orderBaseRef = useRef(0)
  const [form] = Form.useForm<MessageForm>()
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])
  const remainingSlots = Math.max(0, MAX_ATTACHMENT_COUNT - attachments.length)

  function resetOrders(items: AttachmentItem[]) {
    seedAttachmentOrders(items, pathOrderRef.current)
    orderBaseRef.current = items.length
  }

  useImperativeHandle(ref, () => ({
    async open(nextMode, id) {
      setMode(nextMode)
      setEditingId(id ?? null)
      form.resetFields()
      form.setFieldsValue({ title: '', content: '' })
      setAttachments([])
      resetOrders([])
      setVisible(true)
      if (id) {
        const res = await get(id)
        form.setFieldsValue({
          title: res.data.title,
          content: res.data.content,
        })
        const loaded = resolveAttachments(res.data)
        setAttachments(loaded)
        resetOrders(loaded)
      }
    },
  }))

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  function handleUploaded(file: FileInfo, task?: UploadTaskSnapshot) {
    setAttachments((prev) => {
      if (prev.some((item) => item.path === file.path)) return prev
      if (prev.length >= MAX_ATTACHMENT_COUNT) {
        message.warning(`最多上传 ${MAX_ATTACHMENT_COUNT} 个附件`)
        return prev
      }
      const order = orderBaseRef.current + (task?.queueIndex ?? prev.length + 1)
      return insertAttachmentByOrder(prev, toAttachmentItem(file), order, pathOrderRef.current)
    })
    uploaderRef.current?.clearSettled()
  }

  async function handleSubmit() {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      const payload: MessageForm = {
        title: values.title.trim(),
        content: values.content,
        ...toAttachmentPayload(attachments),
      }
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
    <XnDialog
      title={saveDialogTitle(mode, '站内信')}
      open={visible}
      width={820}
      showFullscreen
      destroyOnClose
      onCancel={() => setVisible(false)}
      onConfirm={() => void handleSubmit()}
      confirmText="保存草稿"
      cancelText={readonly ? '关闭' : '取消'}
      showConfirm={!readonly}
      confirmLoading={submitting}
    >
      <Form form={form} labelCol={{ span: 3 }} disabled={readonly} style={{ marginTop: 16 }}>
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input maxLength={200} showCount placeholder="请输入标题" />
        </Form.Item>
        <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
          <XnRichEditor disabled={readonly} height="360px" placeholder="请输入消息内容" />
        </Form.Item>
        <Form.Item label="附件">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!readonly ? (
              <XnUpload
                ref={uploaderRef}
                limit={remainingSlots}
                disabled={remainingSlots <= 0}
                maxSize={MAX_ATTACHMENT_SIZE}
                onSuccess={handleUploaded}
              />
            ) : null}
            {attachments.length ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  maxHeight: ATTACHMENT_LIST_MAX_HEIGHT,
                  overflowY: 'auto',
                }}
              >
                {attachments.map((item, index) => (
                  <div
                    key={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      minWidth: 0,
                      minHeight: ATTACHMENT_ROW_HEIGHT,
                      flexShrink: 0,
                    }}
                  >
                    <Typography.Link
                      href={resolveAttachmentUrl(item.path)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.name}
                    </Typography.Link>
                    <span style={{ color: 'var(--app-text-muted, #909399)', fontSize: 12 }}>
                      {item.size != null ? formatBytes(item.size) : '—'}
                      {' · '}
                      {formatDateTime(item.uploadedAt)}
                    </span>
                    <Typography.Link
                      onClick={(e) => {
                        e.preventDefault()
                        openKkFileViewPreview(item.path, item.name)
                      }}
                    >
                      查看
                    </Typography.Link>
                    {!readonly ? (
                      <Button type="link" danger onClick={() => removeAttachment(index)}>
                        移除
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : readonly ? (
              <span style={{ color: 'var(--app-text-muted, #909399)', fontSize: 13 }}>无附件</span>
            ) : null}
          </div>
        </Form.Item>
      </Form>
    </XnDialog>
  )
})

export default MessageSave
