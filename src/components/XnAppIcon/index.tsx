import { Icon } from '@iconify/react'
import { parseIcon, resolveAntdIcon, getSvgRaw, resolveIconifyName } from '@/utils/icons'

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
    const Comp = resolveAntdIcon(parsed.name)
    if (!Comp) return null
    return <Comp className={className} style={merged} />
  }

  const iconify = resolveIconifyName(name ?? undefined) || (parsed.type === 'iconify' ? parsed.name : null)
  if (iconify) {
    return <Icon icon={iconify} className={className} style={merged} width={dim} height={dim} />
  }

  const Comp = resolveAntdIcon(parsed.name)
  if (Comp) return <Comp className={className} style={merged} />

  return <Icon icon="mdi:circle-medium" className={className} style={merged} width={dim} height={dim} />
}
