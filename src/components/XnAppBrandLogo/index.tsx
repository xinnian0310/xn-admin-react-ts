import { useEffect, useState } from 'react'
import { defaultAppConfig } from '@/config/app'
import { useAppConfig } from '@/hooks/useAppConfig'

const LOCAL_LOGO = defaultAppConfig.app.logo

interface XnAppBrandLogoProps {
  className?: string
  style?: React.CSSProperties
  showTitle?: boolean
  title?: string
}

export default function XnAppBrandLogo({
  className,
  style,
  showTitle = true,
  title,
}: XnAppBrandLogoProps) {
  const appConfig = useAppConfig()
  const name = title || appConfig.app.name
  const configured = (appConfig.app.logo || '').trim() || LOCAL_LOGO
  const [src, setSrc] = useState(configured)

  useEffect(() => {
    setSrc(configured)
  }, [configured])

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflow: 'hidden',
        ...style,
      }}
    >
      <img
        src={src}
        alt={name}
        onError={() => {
          setSrc((current) => (current === LOCAL_LOGO ? current : LOCAL_LOGO))
        }}
        style={{
          width: 'var(--app-logo-width, 28px)',
          height: 'var(--app-logo-height, auto)',
          objectFit: 'contain',
          flexShrink: 0,
        }}
      />
      {showTitle ? (
        <span
          style={{
            fontWeight: 600,
            fontSize: 'var(--app-font-size-sidebar, 14px)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'inherit',
          }}
        >
          {name}
        </span>
      ) : null}
    </div>
  )
}
