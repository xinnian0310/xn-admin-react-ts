import { Layout } from 'antd'
import type { ReactNode } from 'react'
import type { MenuItem } from '@/types/menu'
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

export default function SideLayout({ menus, isFullscreen, children }: Props) {
  const sidebarBg = useThemeStore((s) => s.currentTheme.colors.sidebar.bg)
  const menuTheme = isLightColor(sidebarBg) ? 'light' : 'dark'

  return (
    <Layout className="layout-shell">
      {!isFullscreen ? (
        <Sider width={220} className="layout-aside" theme={menuTheme}>
          <div className="layout-brand">
            <XnAppBrandLogo />
          </div>
          <XnSidebarMenu menus={menus} mode="inline" theme={menuTheme} />
        </Sider>
      ) : null}
      <Layout className="layout-main-col">
        {!isFullscreen ? (
          <Header className="layout-header-bar">
            <div />
            <LayoutHeaderTools />
          </Header>
        ) : null}
        {children}
      </Layout>
    </Layout>
  )
}
