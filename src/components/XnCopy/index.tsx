import { useRef, useState } from 'react'
import { Button, message } from 'antd'
import { CheckOutlined, CopyOutlined } from '@ant-design/icons'
import { copyText } from '@/utils/clipboard'
import './xnCopy.scss'

export type XnCopyProps = {
  text?: string | number | null
  /** 按钮文案；空则只显示图标 */
  label?: string
  copiedLabel?: string
  /** 是否在按钮前展示文本 */
  showText?: boolean
  type?: 'link' | 'default'
  size?: 'large' | 'middle' | 'small'
  disabled?: boolean
  silent?: boolean
  block?: boolean
  onCopied?: (text: string) => void
  onError?: () => void
}

export default function XnCopy({
  text = '',
  label = '',
  copiedLabel = '已复制',
  showText = false,
  type = 'link',
  size = 'small',
  disabled = false,
  silent = false,
  block = false,
  onCopied,
  onError,
}: XnCopyProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const resolvedText = text == null ? '' : String(text)
  const displayText = resolvedText || '—'

  async function onCopy() {
    if (!resolvedText || disabled) return
    const ok = await copyText(resolvedText)
    if (!ok) {
      onError?.()
      if (!silent) message.error('复制失败')
      return
    }
    setCopied(true)
    onCopied?.(resolvedText)
    if (!silent) message.success('已复制')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1500)
  }

  return (
    <span className={['xn-copy', block ? 'is-block' : ''].filter(Boolean).join(' ')}>
      {showText ? <span className="xn-copy__text">{displayText}</span> : null}
      <Button
        type={type}
        size={size}
        disabled={disabled || !resolvedText}
        icon={copied ? <CheckOutlined /> : <CopyOutlined />}
        onClick={(e) => {
          e.stopPropagation()
          void onCopy()
        }}
      >
        {copied ? copiedLabel : label}
      </Button>
    </span>
  )
}
