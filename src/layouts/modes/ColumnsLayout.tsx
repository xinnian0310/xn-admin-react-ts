import { useMemo } from 'react'
import { Layout, Tooltip } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { MenuItem } from '@/types/menu'
import { findFirstNavigablePath, findTopLevelMenu, filterHiddenMenus } from '@/utils/menu'
import { isLightColor } from '@/utils/color'
import { useThemeStore } from '@/stores/theme'
import XnAppBrandLogo from '@/components/XnAppBrandLogo'
import XnAppIcon from '@/components/XnAppIcon'
import XnSidebarMenu from '@/components/XnSidebarMenu'
import LayoutHeaderTools from '../LayoutHeaderTools'

const { Header, Sider } = Layout

interface Props {
  menus: MenuItem[]
  isFullscreen?: boolean
  children?: ReactNode
}

/** 双列：图标轨 + 子菜单侧栏 */
export default function ColumnsLayout({ menus, isFullscreen, children }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const sidebarBg = useThemeStore((s) => s.currentTheme.colors.sidebar.bg)
  const sideMenuTheme = isLightColor(sidebarBg) ? 'light' : 'dark'
  const visible = useMemo(() => filterHiddenMenus(menus), [menus])
  const top = useMemo(() => findTopLevelMenu(visible, location.pathname), [visible, location.pathname])
  const sideMenus = top?.children?.length ? top.children : []

  return (
    <Layout className="layout-shell">
      {!isFullscreen ? (
        <Sider
          width={64}
          className="layout-aside"
          theme={sideMenuTheme}
          style={{ background: 'var(--app-sidebar-rail-bg)' }}
        >
          <div style={{ padding: 12, textAlign: 'center' }}>
            <XnAppBrandLogo showTitle={false} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {visible.map((item) => {
              const path = findFirstNavigablePath(item)
              const active = top?.id === item.id
              return (
                <Tooltip key={item.id} title={item.title} placement="right">
                  <button
                    type="button"
                    onClick={() => path && navigate(path)}
                    style={{
                      width: 40,
                      height: 40,
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: active ? 'var(--app-sidebar-active-bg)' : 'transparent',
                      color: 'var(--app-sidebar-text)',
                    }}
                  >
                    <XnAppIcon name={item.iconAntd || item.icon || 'mdi:menu'} size={20} />
                  </button>
                </Tooltip>
              )
            })}
          </div>
        </Sider>
      ) : null}
      <Layout>
        {!isFullscreen && sideMenus.length ? (
          <Sider width={180} className="layout-aside" theme={sideMenuTheme}>
            <XnSidebarMenu menus={sideMenus} mode="inline" theme={sideMenuTheme} />
          </Sider>
        ) : null}
        <Layout>
          {!isFullscreen ? (
            <Header className="layout-header-bar">
              <XnAppBrandLogo style={{ color: 'inherit' }} />
              <LayoutHeaderTools />
            </Header>
          ) : null}
          {children}
        </Layout>
      </Layout>
    </Layout>
  )
}
