import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import { Alert, Button, Form, Input, InputNumber, Select, message } from 'antd'
import XnDialog from '@/components/XnDialog'
import { createModel, listModels, listProviders, testModel, updateModel } from '@/api/ai/model'
import { getPublicSiteContact } from '@/api/site-contact'
import type { ModelForm, ProviderCatalog } from '@/types/ai/model'
import { isImageSrc } from '@/utils/icons'
import { saveDialogTitle, type SaveMode } from '@/types/save'

export interface ModelSaveHandle {
  open: (
    mode: SaveMode,
    id?: string,
    preset?: { providerId?: string; providerModelId?: string },
  ) => Promise<void>
}

interface Props {
  onSuccess?: () => void
}

const ModelSave = forwardRef<ModelSaveHandle, Props>(function ModelSave({ onSuccess }, ref) {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<SaveMode>('add')
  const [editingId, setEditingId] = useState('')
  const [providers, setProviders] = useState<ProviderCatalog[]>([])
  const [providerId, setProviderId] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [contactLine, setContactLine] = useState('')
  const [form] = Form.useForm<ModelForm>()

  const isEdit = mode === 'edit' && !!editingId
  const selectableProviders = useMemo(
    () => (isEdit ? providers : providers.filter((p) => p.keyConfigured)),
    [isEdit, providers],
  )
  const current =
    selectableProviders.find((p) => p.id === providerId) ||
    providers.find((p) => p.id === providerId)
  const providerModelId = Form.useWatch('providerModelId', form)
  const selectedModel = current?.models.find((m) => m.id === providerModelId)

  async function loadContact() {
    try {
      const contact = await getPublicSiteContact()
      setContactLine(
        (contact.data?.contacts || [])
          .slice(0, 3)
          .map((c) => `${c.label} ${c.value || ''}`.trim())
          .filter(Boolean)
          .join(' · '),
      )
    } catch {
      setContactLine('')
    }
  }

  async function loadDetail(id: string, list: ProviderCatalog[]) {
    const res = await listModels()
    const mine = res.data?.mine.find((m) => m.id === id)
    if (!mine) {
      message.error('模型不存在或无权查看')
      setVisible(false)
      return
    }
    const provider = list.find((p) => p.models.some((m) => m.id === mine.providerModelId))
    setProviderId(provider?.id || '')
    form.setFieldsValue({
      providerModelId: mine.providerModelId,
      name: mine.name,
      maxOutputTokens: mine.maxOutputTokens,
      budgetTokens: mine.budgetTokens ?? undefined,
      temperature: mine.temperature,
      timeoutSeconds: mine.timeoutSeconds,
    })
  }

  useImperativeHandle(ref, () => ({
    async open(openMode, id, preset) {
      setMode(openMode)
      setEditingId(id || '')
      form.resetFields()
      form.setFieldsValue({
        providerModelId: '',
        name: '',
        maxOutputTokens: 4096,
        budgetTokens: 16000,
        temperature: 0.7,
        timeoutSeconds: 120,
      })
      setProviderId('')
      const [provRes] = await Promise.all([listProviders(), loadContact()])
      const list = provRes.data ?? []
      setProviders(list)
      setVisible(true)
      if (openMode !== 'add' && id) {
        await loadDetail(id, list)
        return
      }
      if (preset?.providerId && list.some((p) => p.id === preset.providerId)) {
        setProviderId(preset.providerId)
      } else if (list.length === 1) {
        setProviderId(list[0].id)
      }
      if (preset?.providerModelId) {
        form.setFieldValue('providerModelId', preset.providerModelId)
      }
    },
  }))

  async function onSave() {
    const values = form.getFieldsValue()
    if (!values.providerModelId) {
      message.warning('请选择模型')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        await updateModel(editingId, {
          providerModelId: values.providerModelId,
          name: values.name,
          maxOutputTokens: values.maxOutputTokens,
          budgetTokens: values.budgetTokens,
          temperature: values.temperature,
          timeoutSeconds: values.timeoutSeconds,
        })
        message.success('已保存')
      } else {
        const catalog = current?.models.find((m) => m.id === values.providerModelId)
        if (!providerId || !catalog) {
          message.warning('请选择模型')
          return
        }
        await createModel({
          providerId,
          modelId: catalog.modelId,
          name: values.name,
          maxOutputTokens: values.maxOutputTokens,
          budgetTokens: values.budgetTokens,
          temperature: values.temperature,
          timeoutSeconds: values.timeoutSeconds,
        })
        message.success('已添加')
      }
      setVisible(false)
      onSuccess?.()
    } finally {
      setSaving(false)
    }
  }

  async function onTest() {
    setTesting(true)
    try {
      const res = await testModel(editingId)
      if (res.data?.ok) {
        message.success(`连通正常，耗时 ${res.data.latencyMs} ms`)
      } else {
        message.error(res.data?.message || '探测失败')
      }
    } finally {
      setTesting(false)
    }
  }

  return (
    <XnDialog
      title={saveDialogTitle(mode, '模型')}
      open={visible}
      width={560}
      destroyOnClose
      onCancel={() => setVisible(false)}
      afterClose={() => {
        setEditingId('')
        setProviderId('')
        form.resetFields()
      }}
      footer={
        <>
          <Button onClick={() => setVisible(false)}>取消</Button>
          {isEdit ? (
            <Button loading={testing} onClick={() => void onTest()}>
              探测连通性
            </Button>
          ) : null}
          <Button type="primary" loading={saving} onClick={() => void onSave()}>
            保存
          </Button>
        </>
      }
    >
      <Form form={form} labelCol={{ span: 6 }} style={{ marginTop: 16 }}>
        <Form.Item label="厂商" required>
          <Select
            value={providerId || undefined}
            placeholder="选择厂商"
            disabled={isEdit}
            onChange={(value) => {
              setProviderId(value)
              if (!isEdit) form.setFieldValue('providerModelId', '')
            }}
            options={selectableProviders.map((p) => ({
              value: p.id,
              label: (
                <span className="opt-with-icon">
                  {isImageSrc(p.icon) ? (
                    <img src={p.icon} className="provider-logo" alt="" />
                  ) : null}
                  <span>{p.name}</span>
                </span>
              ),
            }))}
          />
          {current?.docUrl ? (
            <div className="form-hint">
              申请密钥：
              <a href={current.docUrl} target="_blank" rel="noreferrer">
                {current.docUrl}
              </a>
            </div>
          ) : null}
        </Form.Item>
        <Form.Item name="providerModelId" label="模型" required>
          <Select
            placeholder="选择模型"
            disabled={isEdit}
            options={(current?.models ?? []).map((m) => ({
              value: m.id,
              label: m.displayName || m.modelId,
            }))}
            onChange={(id) => {
              if (isEdit) return
              const catalog = current?.models.find((m) => m.id === id)
              if (!catalog) return
              form.setFieldsValue({
                maxOutputTokens: catalog.defaultMaxOutput,
                budgetTokens: catalog.defaultBudgetTokens || 16000,
              })
            }}
          />
          {selectedModel ? (
            <div className="form-hint">
              上下文窗口 {selectedModel.contextTokens} tokens（目录只读） · 默认预算{' '}
              {selectedModel.defaultBudgetTokens || 16000}
            </div>
          ) : null}
        </Form.Item>
        <Form.Item name="name" label="别名">
          <Input placeholder="可选，不填则用目录展示名" maxLength={64} />
        </Form.Item>
        <Form.Item name="maxOutputTokens" label="最大输出">
          <InputNumber min={1} max={selectedModel?.defaultMaxOutput || 4096} />
        </Form.Item>
        <Form.Item name="budgetTokens" label="计费预算">
          <InputNumber min={1} max={128000} />
        </Form.Item>
        <Form.Item name="timeoutSeconds" label="超时（秒）">
          <InputNumber min={5} max={300} />
        </Form.Item>
      </Form>
      <Alert
        type="info"
        showIcon
        closable={false}
        title="目录里没有想用的厂商时，请联系超管在「厂商目录」中添加。员工侧不能填写任何地址。"
        description={contactLine || undefined}
      />
    </XnDialog>
  )
})

export default ModelSave
