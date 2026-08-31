import { useMemo, useRef, useState } from 'react'
import { Button, Input, Menu, Space } from 'antd'
import type { MenuProps } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import type { MenuItem } from '@/types/menu'
import {
  collectOpenMenuIds,
  collectSearchOpenKeys,
  filterHiddenMenus,
  menuNodeKey,
  searchMenus,
} from '@/utils/menu'
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
  /** 覆盖默认选中项（混合布局顶栏按一级菜单高亮） */
  selectedKeys?: string[]
  /** 左侧竖向菜单是否显示搜索框，默认 true */
  showSearch?: boolean
}

function toAntdItems(items: MenuItem[], highlightIds: Set<string>): AntdItem[] {
  return items.map((item) => {
    const children = item.children?.length ? toAntdItems(item.children, highlightIds) : undefined
    const iconName = item.iconAntd || item.icon
    const hit = highlightIds.has(item.id)
    return {
      key: menuNodeKey(item),
      label: item.title,
      icon: iconName ? <XnAppIcon name={iconName} size={16} className="xn-app-icon" /> : undefined,
      children,
      className: hit ? 'is-search-hit' : undefined,
    }
  })
}

function sameKeys(a: string[], b: string[]) {
  return a.length === b.length && a.every((key, index) => key === b[index])
}

function findSelectedKey(pathname: string, menus: MenuItem[]): string {
  const clean = pathname.replace(/\/save(\/.*)?$/, '')
  const walk = (items: MenuItem[]): string | null => {
    for (const item of items) {
      if (item.path === clean || item.path === pathname) return menuNodeKey(item)
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
  selectedKeys: selectedKeysProp,
  showSearch = true,
}: XnSidebarMenuProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const wrapRef = useRef<HTMLDivElement>(null)
  const visible = useMemo(() => filterHiddenMenus(menus), [menus])
  const activePath = location.pathname.replace(/\/save(\/.*)?$/, '') || location.pathname
  const selectedKey = findSelectedKey(location.pathname, visible)
  const routeOpenKeys = useMemo(() => {
    if (mode === 'horizontal') return [] as string[]
    return collectOpenMenuIds(visible, activePath) || []
  }, [visible, activePath, mode])

  const [openKeys, setOpenKeys] = useState<string[]>(routeOpenKeys)
  const [appliedRouteKeys, setAppliedRouteKeys] = useState(routeOpenKeys)
  const [searchDraft, setSearchDraft] = useState('')
  const [highlightIds, setHighlightIds] = useState<Set<string>>(() => new Set())

  if (mode !== 'horizontal' && !sameKeys(appliedRouteKeys, routeOpenKeys)) {
    setAppliedRouteKeys(routeOpenKeys)
    setOpenKeys((prev) => Array.from(new Set([...prev, ...routeOpenKeys])))
  }

  const items = useMemo(() => toAntdItems(visible, highlightIds), [visible, highlightIds])
  const enableSearch = showSearch && mode === 'inline' && !collapsed

  function clearSearch() {
    setSearchDraft('')
    setHighlightIds(new Set())
  }

  function runSearch() {
    const keyword = searchDraft.trim()
    if (!keyword) {
      setHighlightIds(new Set())
      return
    }
    const hits = searchMenus(visible, keyword)
    setHighlightIds(new Set(hits.map((h) => h.id)))
    const keys = collectSearchOpenKeys(hits)
    setOpenKeys((prev) => Array.from(new Set([...prev, ...keys])))

    const firstId = hits[0]?.id
    if (!firstId) return
    window.setTimeout(() => {
      const el = wrapRef.current?.querySelector('.is-search-hit') as HTMLElement | null
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, 120)
  }

  const menuNode = (
    <Menu
      className={className}
      style={
        enableSearch ? { ...style, flex: 1, overflow: 'auto', borderInlineEnd: 'none' } : style
      }
      theme={theme}
      mode={mode}
      inlineCollapsed={collapsed}
      selectedKeys={selectedKeysProp ?? [selectedKey]}
      openKeys={mode === 'horizontal' ? undefined : openKeys}
      onOpenChange={(keys) => setOpenKeys(keys as string[])}
      items={items}
      onClick={({ key }) => {
        const path = String(key)
        if (!path.startsWith('/')) return
        onSelectPath?.(path)
        navigate(path)
      }}
    />
  )

  if (!enableSearch) {
    return menuNode
  }

  return (
    <div ref={wrapRef} className="xn-sidebar-menu-wrap">
      <div className="xn-sidebar-menu-search">
        <Space.Compact style={{ width: '100%' }}>
          <Input
            allowClear
            value={searchDraft}
            placeholder="搜索菜单"
            onChange={(e) => setSearchDraft(e.target.value)}
            onPressEnter={runSearch}
            onClear={clearSearch}
          />
          <Button
            type="default"
            icon={<SearchOutlined />}
            aria-label="搜索菜单"
            onClick={runSearch}
          />
        </Space.Compact>
      </div>
      {menuNode}
    </div>
  )
}
