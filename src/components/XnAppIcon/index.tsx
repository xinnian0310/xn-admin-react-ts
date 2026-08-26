import { createElement } from 'react'
import { Icon } from '@iconify/react'
import { parseIcon, resolveAntdIcon, getSvgRaw, resolveIconifyName } from '@/utils/icons'

function renderAntdIcon(name: string, className?: string, style?: React.CSSProperties) {
  const icon = resolveAntdIcon(name)
  if (!icon) return null
  return createElement(icon, { className, style })
}

interface XnAppIconProps {
  name?: string | null
  size?: number | string
  className?: string
  style?: React.CSSProperties
}

export default function XnAppIcon({ name, size = 16, className, style }: XnAppIconProps) {
  const parsed = parseIcon(name)
  if (!parsed) return null

  const dim = typeof size === 'number' ? `${size}px` : size
  const merged = { fontSize: dim, width: dim, height: dim, ...style }

  if (parsed.type === 'svg') {
    const raw = getSvgRaw(parsed.name)
    if (!raw) return null
    return (
      <span
        className={className}
        style={{ display: 'inline-flex', ...merged }}
        dangerouslySetInnerHTML={{ __html: raw }}
      />
    )
  }

  if (parsed.type === 'antd') {
    return renderAntdIcon(parsed.name, className, merged)
  }

  const iconify =
    resolveIconifyName(name ?? undefined) || (parsed.type === 'iconify' ? parsed.name : null)
  if (iconify) {
    return <Icon icon={iconify} className={className} style={merged} width={dim} height={dim} />
  }

  return (
    renderAntdIcon(parsed.name, className, merged) ?? (
      <Icon
        icon="mdi:circle-medium"
        className={className}
        style={merged}
        width={dim}
        height={dim}
      />
    )
  )
}
