import type { ReactNode } from 'react'
import './xnEmpty.scss'

export type XnEmptyType = 'data' | 'permission' | 'search' | 'error'

const PRESETS: Record<XnEmptyType, { title: string; description: string }> = {
  data: { title: '暂无数据', description: '没有符合条件的记录' },
  permission: { title: '暂无权限', description: '你没有查看该内容的权限' },
  search: { title: '无匹配结果', description: '试试调整筛选条件' },
  error: { title: '加载失败', description: '请稍后重试' },
}

export type XnEmptyProps = {
  type?: XnEmptyType
  title?: string
  description?: string
  size?: 'default' | 'small'
  children?: ReactNode
}

function EmptyIcon({ type }: { type: XnEmptyType }) {
  return (
    <svg className="xn-empty__icon" viewBox="0 0 64 64" fill="none" aria-hidden>
      {type === 'data' || type === 'search' ? (
        <>
          <rect x="12" y="18" width="40" height="28" rx="4" />
          <path d="M20 28h24M20 36h16" strokeLinecap="round" />
        </>
      ) : null}
      {type === 'search' ? (
        <>
          <circle cx="42" cy="40" r="7" />
          <path d="M47 45l6 6" strokeLinecap="round" />
        </>
      ) : null}
      {type === 'permission' ? (
        <>
          <rect x="20" y="26" width="24" height="18" rx="3" />
          <path d="M26 26v-5a6 6 0 0 1 12 0v5" strokeLinecap="round" />
        </>
      ) : null}
      {type === 'error' ? (
        <>
          <circle cx="32" cy="32" r="14" />
          <path d="M32 24v12M32 42v.5" strokeLinecap="round" />
        </>
      ) : null}
    </svg>
  )
}

export default function XnEmpty({
  type = 'data',
  title,
  description,
  size = 'default',
  children,
}: XnEmptyProps) {
  const resolvedTitle = title || PRESETS[type].title
  const resolvedDescription = description === '' ? '' : (description ?? PRESETS[type].description)

  return (
    <div className="xn-empty" data-type={type} data-size={size}>
      <div className="xn-empty__visual">
        <EmptyIcon type={type} />
      </div>
      <p className="xn-empty__title">{resolvedTitle}</p>
      {resolvedDescription ? <p className="xn-empty__desc">{resolvedDescription}</p> : null}
      {children ? <div className="xn-empty__extra">{children}</div> : null}
    </div>
  )
}
