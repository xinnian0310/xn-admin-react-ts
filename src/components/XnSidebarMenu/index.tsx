import { useMemo } from 'react'
import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import type { MenuItem } from '@/types/menu'
import { filterHiddenMenus, collectOpenMenuIds } from '@/utils/menu'
import XnAppIcon from '@/components/XnAppIcon'

type AntdItem = Required<MenuProps>['items'][number]

interface XnSidebarMenuProps {
  menus: MenuItem[]
  mode?: 'inline' | 'horizontal' | 'vertical'
  theme?: 'light' | 'dark'
  collapsed?: boolean
  className?: string
  style?: React.CSSProperties
  onSelectPath?: (path: string) => void
}

function toAntdItems(items: MenuItem[]): AntdItem[] {
  return items.map((item) => {
    const children = item.children?.length ? toAntdItems(item.children) : undefined
    const iconName = item.iconAntd || item.icon
    return {
      key: item.path || `menu-${item.id}`,
      label: item.title,
      icon: iconName ? <XnAppIcon name={iconName} size={16} className="xn-app-icon" /> : undefined,
      children,
    }
  })
}

function findSelectedKey(pathname: string, menus: MenuItem[]): string {
  const clean = pathname.replace(/\/save(\/.*)?$/, '')
  const walk = (items: MenuItem[]): string | null => {
    for (const item of items) {
      if (item.path === clean || item.path === pathname) return item.path
      if (item.children) {
        const found = walk(item.children)
        if (found) return found
      }
    }
    return null
  }
  return walk(menus) || pathname
}

export default function XnSidebarMenu({
  menus,
  mode = 'inline',
  theme = 'dark',
  collapsed,
  className,
  style,
  onSelectPath,
}: XnSidebarMenuProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const visible = useMemo(() => filterHiddenMenus(menus), [menus])
  const items = useMemo(() => toAntdItems(visible), [visible])
  const selectedKey = findSelectedKey(location.pathname, visible)
  const openKeys = useMemo(() => {
    if (mode === 'horizontal') return undefined
    return collectOpenMenuIds(visible, selectedKey) || []
  }, [visible, selectedKey, mode])

  return (
    <Menu
      className={className}
      style={style}
      theme={theme}
      mode={mode}
      inlineCollapsed={collapsed}
      selectedKeys={[selectedKey]}
      defaultOpenKeys={openKeys}
      items={items}
      onClick={({ key }) => {
        const path = String(key)
        if (!path.startsWith('/')) return
        onSelectPath?.(path)
        navigate(path)
      }}
    />
  )
}
