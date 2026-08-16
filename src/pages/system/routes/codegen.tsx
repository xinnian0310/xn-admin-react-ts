import { forwardRef, useImperativeHandle, useState } from 'react'
import { Alert, Button, Form, Input, Space, Switch, Tabs, Tag, message } from 'antd'
import { generate, type RouteCodegenResult } from '@/api/route'
import type { SysRoute } from '@/types'
import XnModal from '@/components/XnModal'

export interface RouteCodegenHandle {
  open: (row: SysRoute) => void
}

function downloadZip(base64: string, fileName: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

const RouteCodegen = forwardRef<RouteCodegenHandle, object>(function RouteCodegen(_props, ref) {
  const [visible, setVisible] = useState(false)
  const [route, setRoute] = useState<SysRoute | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<RouteCodegenResult | null>(null)
  const [activeTab, setActiveTab] = useState('sql')
  const [form] = Form.useForm<{
    modulePrefix: string
    apiBasePath: string
    persistPermissions: boolean
    generatePageUi: boolean
  }>()

  useImperativeHandle(ref, () => ({
    open(row) {
      setRoute(row)
      setResult(null)
      setActiveTab('sql')
      const prefix =
        (row.path || '').replace(/^\//, '').split('/').filter(Boolean).pop() || 'module'
      const modulePrefix = prefix.toLowerCase()
      form.setFieldsValue({
        modulePrefix,
        apiBasePath: `/api/${modulePrefix}`,
        persistPermissions: true,
        generatePageUi: true,
      })
      setVisible(true)
    },
  }))

  async function handleGenerate() {
    if (!route) return
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      const res = await generate(route.id, values)
      setResult(res.data)
      message.success('生成成功')
    } finally {
      setSubmitting(false)
    }
  }

  async function copyCurrent() {
    if (!result) return
    const content =
      activeTab === 'sql'
        ? result.sql
        : result.files.find((f) => f.path === activeTab)?.content || ''
    await navigator.clipboard.writeText(content)
    message.success('已复制')
  }

  return (
    <XnModal
      title={`代码生成 - ${route?.title || ''}`}
      open={visible}
      onCancel={() => setVisible(false)}
      destroyOnHidden
      width={820}
      footer={
        result ? (
          <Space>
            <Button onClick={() => setResult(null)}>返回修改</Button>
            <Button onClick={() => void copyCurrent()}>复制当前</Button>
            <Button
              type="primary"
              onClick={() => downloadZip(result.zipBase64, `codegen-${result.modulePrefix}.zip`)}
            >
              下载 ZIP
            </Button>
          </Space>
        ) : (
          <Space>
            <Button onClick={() => setVisible(false)}>取消</Button>
            <Button type="primary" loading={submitting} onClick={() => void handleGenerate()}>
              生成
            </Button>
          </Space>
        )
      }
    >
      {!result ? (
        <>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message="生成结果为 ZIP 预览包；复制到工程后需重启 xn-system 并刷新菜单。权限可选择落库。"
          />
          <DescriptionsLike
            items={[
              { label: '菜单', value: route?.title },
              { label: '路径', value: route?.path },
              { label: '视图', value: route?.viewPath ? `pages/${route.viewPath}/index.tsx` : '—' },
            ]}
          />
          <Form form={form} labelCol={{ span: 6 }} style={{ marginTop: 16 }}>
            <Form.Item
              name="modulePrefix"
              label="模块前缀"
              rules={[{ required: true, message: '请输入模块前缀' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="apiBasePath"
              label="API 前缀"
              rules={[{ required: true, message: '请输入 API 前缀' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="persistPermissions" label="落库权限" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="generatePageUi" label="生成 PageUi" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </>
      ) : (
        <>
          <Alert
            type="success"
            showIcon
            style={{ marginBottom: 12 }}
            message={`已落库权限 ${result.persistedPermissionCount} 条${
              result.pageUiPersisted ? '，PageUi 已写入' : ''
            }`}
          />
          <div style={{ marginBottom: 8 }}>
            {result.permissionCodes.map((c) => (
              <Tag key={c}>{c}</Tag>
            ))}
          </div>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'sql', label: 'SQL', children: <PreBlock text={result.sql} /> },
              ...result.files.map((f) => ({
                key: f.path,
                label: f.path,
                children: <PreBlock text={f.content} />,
              })),
            ]}
          />
        </>
      )}
    </XnModal>
  )
})

function DescriptionsLike({ items }: { items: { label: string; value?: string }[] }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {items.map((item) => (
        <div key={item.label}>
          <span style={{ color: '#94a3b8' }}>{item.label}：</span>
          <span>{item.value || '—'}</span>
        </div>
      ))}
    </div>
  )
}

function PreBlock({ text }: { text: string }) {
  return (
    <pre
      style={{
        maxHeight: 360,
        overflow: 'auto',
        background: '#0f172a',
        color: '#e2e8f0',
        padding: 12,
        borderRadius: 8,
        fontSize: 12,
      }}
    >
      {text}
    </pre>
  )
}

export default RouteCodegen
