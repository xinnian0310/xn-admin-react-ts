import { Empty } from 'antd'
import { useMatches } from 'react-router-dom'
import type { AppRouteMeta } from '@/types/menu'
import './index.scss'

export default function IframePage() {
  const matches = useMatches()
  const meta = matches[matches.length - 1]?.handle as AppRouteMeta | undefined
  const src = String(meta?.linkUrl ?? '').trim()
  const title = String(meta?.title ?? '外部链接')

  return (
    <div className="iframe-page">
      {src ? (
        <iframe className="iframe-frame" src={src} title={title} />
      ) : (
        <Empty description="未配置外部链接" />
      )}
    </div>
  )
}
