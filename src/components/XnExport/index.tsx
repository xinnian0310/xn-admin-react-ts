import { forwardRef, useImperativeHandle, useState, type ReactNode } from 'react'
import { Button, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import type { ButtonProps } from 'antd'
import XnPopconfirm from '@/components/XnPopconfirm'
import { buildQueryString, downloadWithAuth } from '@/utils/download'
import { showCaughtError } from '@/utils/request'

export type XnExportType = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'

export type XnExportHandle = {
  export: () => Promise<void>
}

export type XnExportProps = {
  /** 自定义导出；传入后忽略 url */
  request?: () => Promise<void>
  /** 带鉴权的下载地址，如 /api/users/export */
  url?: string
  filename?: string
  params?: Record<string, unknown>
  text?: string
  type?: XnExportType
  plain?: boolean
  disabled?: boolean
  children?: ReactNode
  /** 成功后是否 toast；页面自己提示时关掉，避免双提示 */
  showMessage?: boolean
  successMessage?: string
  /** 导出前气泡确认 */
  confirm?: boolean
  confirmTitle?: string
  onSuccess?: () => void
  onError?: (message: string) => void
}

function mapButtonType(type: XnExportType): Pick<ButtonProps, 'type' | 'danger' | 'color'> {
  if (type === 'danger') return { type: 'primary', danger: true }
  if (type === 'primary') return { type: 'primary' }
  if (type === 'success') return { color: 'green', type: 'primary' }
  if (type === 'warning') return { color: 'orange', type: 'primary' }
  return { type: 'default' }
}

const XnExport = forwardRef<XnExportHandle, XnExportProps>(function XnExport(
  {
    request,
    url = '',
    filename = 'export.xlsx',
    params = {},
    text = '导出',
    type = 'primary',
    plain = true,
    disabled = false,
    children,
    showMessage = true,
    successMessage = '导出成功',
    confirm = false,
    confirmTitle = '确定导出当前数据吗？',
    onSuccess,
    onError,
  },
  ref,
) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    if (loading || disabled) return
    setLoading(true)
    try {
      if (request) {
        await request()
      } else if (url) {
        const qs = buildQueryString(params || {})
        await downloadWithAuth(`${url}${qs}`, filename)
      } else {
        throw new Error('未配置导出请求')
      }
      if (showMessage) message.success(successMessage)
      onSuccess?.()
    } catch (error) {
      const msg = error instanceof Error ? error.message : '导出失败'
      onError?.(msg)
      showCaughtError(error, '导出失败')
    } finally {
      setLoading(false)
    }
  }

  useImperativeHandle(ref, () => ({ export: handleExport }))

  const button = (
    <Button
      {...mapButtonType(type)}
      ghost={plain}
      disabled={disabled || loading}
      loading={loading}
      icon={<DownloadOutlined />}
      htmlType="button"
      onClick={confirm ? undefined : () => void handleExport()}
    >
      {children ?? text}
    </Button>
  )

  if (confirm) {
    return (
      <XnPopconfirm
        title={confirmTitle}
        disabled={disabled || loading}
        onConfirm={() => void handleExport()}
      >
        {button}
      </XnPopconfirm>
    )
  }

  return button
})

export default XnExport
