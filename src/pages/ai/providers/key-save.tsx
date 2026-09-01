import { forwardRef, useImperativeHandle, useState } from 'react'
import { Form, Input, message } from 'antd'
import XnDialog from '@/components/XnDialog'
import { saveProviderCredential } from '@/api/ai/model'
import type { AdminProvider } from '@/types/ai/admin'
import { showCaughtError } from '@/utils/request'
import './providers.scss'

export interface ProviderKeySaveHandle {
  open: (row: AdminProvider) => void
}

interface Props {
  onSuccess?: () => void
}

const ProviderKeySave = forwardRef<ProviderKeySaveHandle, Props>(function ProviderKeySave(
  { onSuccess },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState<AdminProvider | null>(null)

  function reset() {
    setApiKey('')
    setProvider(null)
  }

  useImperativeHandle(ref, () => ({
    open(row) {
      reset()
      setProvider(row)
      setVisible(true)
    },
  }))

  async function onSave() {
    if (!provider) return
    const trimmed = apiKey.trim()
    if (!trimmed) {
      message.warning('请填写 API Key')
      return
    }
    setSaving(true)
    try {
      await saveProviderCredential(provider.id, trimmed)
      message.success('密钥已保存')
      setVisible(false)
      onSuccess?.()
    } catch (e) {
      showCaughtError(e, '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <XnDialog
      title="配置密钥"
      open={visible}
      width={480}
      destroyOnClose
      onCancel={() => setVisible(false)}
      afterClose={reset}
      confirmText="保存"
      confirmLoading={saving}
      onConfirm={() => void onSave()}
    >
      {provider ? (
        <p className="key-save__hint">
          为「{provider.name}」保存你自己的 API Key。密钥加密入库，页面只显示掩码，不会回显明文。
        </p>
      ) : null}
      <Form labelCol={{ span: 5 }} onFinish={() => void onSave()}>
        <Form.Item label="当前密钥">
          <span className="key-save__mask">{provider?.keyMask || '未配置'}</span>
        </Form.Item>
        <Form.Item label="API Key" required>
          <div>
            <Input.Password
              value={apiKey}
              autoComplete="new-password"
              placeholder={provider?.keyHint || '填入该厂商的 API Key'}
              onChange={(e) => setApiKey(e.target.value)}
              onPressEnter={() => void onSave()}
            />
            {provider?.docUrl ? (
              <p className="key-save__doc">
                <a href={provider.docUrl} target="_blank" rel="noreferrer">
                  申请密钥
                </a>
              </p>
            ) : null}
          </div>
        </Form.Item>
      </Form>
    </XnDialog>
  )
})

export default ProviderKeySave
