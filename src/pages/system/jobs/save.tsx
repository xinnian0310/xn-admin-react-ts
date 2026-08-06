import { forwardRef, useImperativeHandle, useState } from 'react'
import { Form, Input, Modal, Radio, Select, Switch, message } from 'antd'
import { createJob, getJob, updateJob } from '@/api/file-job'
import type { JobForm } from '@/types'
import { saveDialogTitle, type SaveMode } from '@/types/save'

export interface JobSaveHandle {
  open: (mode: SaveMode, id?: number) => Promise<void>
}

const misfireOptions = [
  { value: '0', label: '默认（放弃本次）' },
  { value: '1', label: '忽略 misfire（尽快补齐）' },
  { value: '2', label: '立即补偿执行一次' },
  { value: '3', label: '不触发立即执行' },
]

const JobSave = forwardRef<JobSaveHandle, { onSuccess?: () => void }>(function JobSave(
  { onSuccess },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<SaveMode>('add')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<JobForm>()

  useImperativeHandle(ref, () => ({
    async open(openMode, id) {
      setMode(openMode)
      setEditingId(id ?? null)
      form.resetFields()
      form.setFieldsValue({
        name: '',
        jobKey: '',
        cron: '0 */5 * * * ?',
        invokeTarget: 'demoJob.heartbeat',
        status: 0,
        remark: '',
        concurrent: false,
        misfirePolicy: '0',
      })
      setVisible(true)
      if (openMode !== 'add' && id) {
        const res = await getJob(id)
        form.setFieldsValue({
          name: res.data.name,
          jobKey: res.data.jobKey,
          cron: res.data.cron,
          invokeTarget: res.data.invokeTarget,
          status: res.data.status,
          remark: res.data.remark || '',
          concurrent: res.data.concurrent ?? false,
          misfirePolicy: res.data.misfirePolicy || '0',
        })
      }
    },
  }))

  async function handleSubmit() {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      if (mode === 'edit' && editingId) {
        await updateJob(editingId, values)
        message.success('更新成功')
      } else {
        await createJob(values)
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
      title={saveDialogTitle(mode, '定时任务')}
      open={visible}
      onCancel={() => setVisible(false)}
      destroyOnHidden
      width={640}
      okText="保存"
      cancelText={mode === 'view' ? '关闭' : '取消'}
      okButtonProps={{ style: mode === 'view' ? { display: 'none' } : undefined }}
      confirmLoading={submitting}
      onOk={() => void handleSubmit()}
    >
      <Form form={form} labelCol={{ span: 5 }} disabled={mode === 'view'}>
        <Form.Item
          name="name"
          label="任务名称"
          rules={[{ required: true, message: '请输入任务名称' }]}
        >
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item
          name="jobKey"
          label="任务标识"
          rules={[{ required: true, message: '请输入任务标识' }]}
        >
          <Input maxLength={100} placeholder="唯一标识，如 demo-heartbeat" />
        </Form.Item>
        <Form.Item
          name="cron"
          label="Cron"
          rules={[{ required: true, message: '请输入 Cron 表达式' }]}
        >
          <Input placeholder="如 0 */5 * * * ?" />
        </Form.Item>
        <Form.Item
          name="invokeTarget"
          label="调用目标"
          rules={[{ required: true, message: '请输入调用目标' }]}
        >
          <Input placeholder="如 demoJob.heartbeat" />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Radio.Group
            options={[
              { label: '启用', value: 1 },
              { label: '停用', value: 0 },
            ]}
          />
        </Form.Item>
        <Form.Item name="concurrent" label="允许并发" valuePropName="checked">
          <Switch />
        </Form.Item>
        <div style={{ margin: '-8px 0 16px 20.833%', fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
          关闭后同一任务不会重叠执行（Quartz DisallowConcurrent）
        </div>
        <Form.Item name="misfirePolicy" label="misfire策略">
          <Select options={misfireOptions} />
        </Form.Item>
        <div style={{ margin: '-8px 0 16px 20.833%', fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
          错过触发时间后的补偿策略（对标若依 Quartz）
        </div>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} maxLength={500} />
        </Form.Item>
      </Form>
    </Modal>
  )
})

export default JobSave
