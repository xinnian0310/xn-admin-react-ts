import type { ReactNode } from 'react'
import { Descriptions } from 'antd'
import XnCopy from '@/components/XnCopy'
import './xnDesc.scss'

export type DescItem = {
  label: string
  value?: unknown
  prop?: string
  span?: number
  type?: 'text' | 'pre' | 'copy'
  emptyText?: string
  children?: ReactNode
}

export type XnDescProps = {
  items: DescItem[]
  title?: ReactNode
  column?: number
  bordered?: boolean
  size?: 'large' | 'middle' | 'small'
}

function displayValue(item: DescItem) {
  const text = item.value
  if (text === null || text === undefined || text === '') return item.emptyText ?? '—'
  return String(text)
}

export default function XnDesc({
  items = [],
  title = '',
  column = 1,
  bordered = true,
  size,
}: XnDescProps) {
  return (
    <Descriptions
      className="xn-desc"
      title={title || undefined}
      column={column}
      bordered={bordered}
      size={size}
    >
      {items.map((item, index) => (
        <Descriptions.Item
          key={item.prop || `${item.label}-${index}`}
          label={item.label}
          span={item.span}
        >
          {item.type === 'pre' ? (
            <pre className="xn-desc__pre">{displayValue(item)}</pre>
          ) : item.type === 'copy' ? (
            <span className="xn-desc__copy">
              <span>{displayValue(item)}</span>
              {item.value != null && item.value !== '' ? (
                <XnCopy text={String(item.value)} />
              ) : null}
            </span>
          ) : (
            (item.children ?? displayValue(item))
          )}
        </Descriptions.Item>
      ))}
    </Descriptions>
  )
}
