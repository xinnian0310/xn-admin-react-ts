import { useMemo } from 'react'
import { Layout } from 'antd'
import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { MenuItem } from '@/types/menu'
import { findTopLevelMenu } from '@/utils/menu'
import { isLightColor } from '@/utils/color'
import { useThemeStore } from '@/stores/theme'
import XnAppBrandLogo from '@/components/XnAppBrandLogo'
import XnSidebarMenu from '@/components/XnSidebarMenu'
import LayoutHeaderTools from '../LayoutHeaderTools'

const { Header, Sider } = Layout

interface Props {
  menus: MenuItem[]
  isFullscreen?: boolean
  children?: ReactNode
}

/** 混合布局：顶栏一级 + 侧栏子级 */
export default function MixLayout({ menus, isFullscreen, children }: Props) {
  const location = useLocation()
  const headerBg = useThemeStore((s) => s.currentTheme.colors.header.bg)
  const sidebarBg = useThemeStore((s) => s.currentTheme.colors.sidebar.bg)
  const headerMenuTheme = isLightColor(headerBg) ? 'light' : 'dark'
  const sideMenuTheme = isLightColor(sidebarBg) ? 'light' : 'dark'
  const top = useMemo(() => findTopLevelMenu(menus, location.pathname), [menus, location.pathname])
  const sideMenus = top?.children?.length ? top.children : menus
  const topMenus = menus.map((m) => ({ ...m, children: undefined }))

  return (
    <Layout className="layout-shell">
      {!isFullscreen ? (
        <Header className="layout-header-bar" style={{ display: 'flex', gap: 16 }}>
          <XnAppBrandLogo style={{ color: 'inherit', minWidth: 160 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <XnSidebarMenu
              menus={topMenus}
              mode="horizontal"
              theme={headerMenuTheme}
              style={{ background: 'transparent' }}
            />
          </div>
          <LayoutHeaderTools />
        </Header>
      ) : null}
      <Layout>
        {!isFullscreen ? (
          <Sider width={200} className="layout-aside" theme={sideMenuTheme}>
            <XnSidebarMenu menus={sideMenus} mode="inline" theme={sideMenuTheme} />
          </Sider>
        ) : null}
        <Layout>{children}</Layout>
      </Layout>
    </Layout>
  )
}
