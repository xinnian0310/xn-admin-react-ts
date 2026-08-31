import { useMemo } from 'react'
import { Layout } from 'antd'
import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { MenuItem } from '@/types/menu'
import {
  filterHiddenMenus,
  findFirstNavigablePath,
  findTopLevelMenu,
  menuNodeKey,
} from '@/utils/menu'
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
  const rootMenus = useMemo(() => filterHiddenMenus(menus), [menus])
  const top = useMemo(
    () => findTopLevelMenu(rootMenus, location.pathname) ?? rootMenus[0],
    [rootMenus, location.pathname],
  )
  const sideMenus = top?.children?.length ? top.children : []
  const topMenus = useMemo(
    () =>
      rootMenus.map((m) => ({
        ...m,
        path: findFirstNavigablePath(m),
        children: undefined,
      })),
    [rootMenus],
  )
  const selectedTopKey = top ? findFirstNavigablePath(top) || menuNodeKey(top) : ''

  return (
    <Layout className="layout-shell layout-mix">
      {!isFullscreen ? (
        <Header className="layout-header-bar layout-mix__header">
          <XnAppBrandLogo className="layout-mix__brand" style={{ color: 'inherit' }} />
          <div className="layout-mix__top-menu">
            <XnSidebarMenu
              menus={topMenus}
              mode="horizontal"
              theme={headerMenuTheme}
              selectedKeys={selectedTopKey ? [selectedTopKey] : []}
              showSearch={false}
              style={{ background: 'transparent' }}
            />
          </div>
          <LayoutHeaderTools />
        </Header>
      ) : null}
      <Layout className="layout-mix__body">
        {!isFullscreen && sideMenus.length ? (
          <Sider width={200} className="layout-aside" theme={sideMenuTheme}>
            {top?.title ? <div className="layout-aside__subtitle">{top.title}</div> : null}
            <XnSidebarMenu menus={sideMenus} mode="inline" theme={sideMenuTheme} />
          </Sider>
        ) : null}
        <Layout className="layout-main-col">{children}</Layout>
      </Layout>
    </Layout>
  )
}
