import { Layout } from 'antd'
import type { ReactNode } from 'react'
import type { MenuItem } from '@/types/menu'
import { isLightColor } from '@/utils/color'
import { useThemeStore } from '@/stores/theme'
import XnAppBrandLogo from '@/components/XnAppBrandLogo'
import XnSidebarMenu from '@/components/XnSidebarMenu'
import LayoutHeaderTools from '../LayoutHeaderTools'

const { Header } = Layout

interface Props {
  menus: MenuItem[]
  isFullscreen?: boolean
  children?: ReactNode
}

/** 顶栏布局：水平菜单 */
export default function TopLayout({ menus, isFullscreen, children }: Props) {
  const headerBg = useThemeStore((s) => s.currentTheme.colors.header.bg)
  const menuTheme = isLightColor(headerBg) ? 'light' : 'dark'

  return (
    <Layout className="layout-shell">
      {!isFullscreen ? (
        <Header className="layout-header-bar" style={{ display: 'flex', gap: 16 }}>
          <XnAppBrandLogo style={{ color: 'inherit', minWidth: 160 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <XnSidebarMenu
              menus={menus}
              mode="horizontal"
              theme={menuTheme}
              style={{ background: 'transparent', lineHeight: '56px', flex: 1 }}
            />
          </div>
          <LayoutHeaderTools />
        </Header>
      ) : null}
      <Layout>{children}</Layout>
    </Layout>
  )
}
