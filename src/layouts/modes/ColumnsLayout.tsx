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
  const top = useMemo(
    () => findTopLevelMenu(visible, location.pathname) ?? visible[0],
    [visible, location.pathname],
  )
  const sideMenus = top?.children?.length ? top.children : []

  return (
    <Layout className="layout-shell layout-columns">
      {!isFullscreen ? (
        <Sider width={64} className="layout-columns-rail" theme={sideMenuTheme}>
          <div className="layout-columns-rail__brand">
            <XnAppBrandLogo showTitle={false} />
          </div>
          <div className="layout-columns-rail__items">
            {visible.map((item) => {
              const path = findFirstNavigablePath(item)
              const active = top?.id === item.id
              const iconName = item.iconAntd || item.icon
              return (
                <Tooltip key={item.id} title={item.title} placement="right">
                  <button
                    type="button"
                    className={`layout-columns-rail__item${active ? ' is-active' : ''}`}
                    onClick={() => path && navigate(path)}
                  >
                    {iconName ? (
                      <XnAppIcon name={iconName} size={20} />
                    ) : (
                      <span className="layout-columns-rail__text">{item.title.charAt(0)}</span>
                    )}
                  </button>
                </Tooltip>
              )
            })}
          </div>
        </Sider>
      ) : null}
      <Layout className="layout-columns__body">
        {!isFullscreen && sideMenus.length ? (
          <Sider width={200} className="layout-aside" theme={sideMenuTheme}>
            {top?.title ? <div className="layout-aside__subtitle">{top.title}</div> : null}
            <XnSidebarMenu menus={sideMenus} mode="inline" theme={sideMenuTheme} />
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
    </Layout>
  )
}
