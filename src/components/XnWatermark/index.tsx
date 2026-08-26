import type { ReactNode } from 'react'
import { Watermark } from 'antd'
import './xnWatermark.scss'

export type XnWatermarkProps = {
  /** 不传则展示「心念科技」 */
  content?: string | string[]
  disabled?: boolean
  gap?: [number, number]
  children?: ReactNode
}

export default function XnWatermark({
  content,
  disabled = false,
  gap = [140, 120],
  children,
}: XnWatermarkProps) {
  const resolved = (() => {
    if (disabled) return []
    if (content != null) return Array.isArray(content) ? content : [content]
    return ['心念科技']
  })()

  return (
    <Watermark
      className="xn-watermark"
      content={resolved}
      gap={gap}
      inherit={false}
      font={{ color: 'rgba(0, 0, 0, 0.08)', fontSize: 14 }}
    >
      {children}
    </Watermark>
  )
}
