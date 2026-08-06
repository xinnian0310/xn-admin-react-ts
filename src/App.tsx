import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { App as AntdApp, ConfigProvider, Spin, theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AppRouter from '@/router'
import { applyAppConfig, applyRemoteAppConfig, captureGlobalUiBaseline, mapAntdComponentSize, appConfig } from '@/config/app'
import { isLightColor } from '@/utils/color'
import { getPublicConfig } from '@/api/system-config'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useUiPreferenceStore } from '@/stores/uiPreference'
import { startSessionGuard } from '@/utils/session-guard'
import ThemePicker from '@/components/ThemePicker'

function AntdThemeBridge({ children }: { children: ReactNode }) {
  const currentTheme = useThemeStore((s) => s.currentTheme)
  const effectiveAppearance = useThemeStore((s) => s.effectiveAppearance)
  const colors = currentTheme.colors
  const primary = colors.primary
  const siderLight = isLightColor(colors.sidebar.bg)

  return (
    <ConfigProvider
      locale={zhCN}
      componentSize={mapAntdComponentSize(appConfig.ui.elementPlus.size)}
      theme={{
        cssVar: {},
        algorithm:
          effectiveAppearance === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: primary,
          borderRadius: 6,
          colorBgLayout: effectiveAppearance === 'dark' ? '#000000' : '#f5f5f5',
        },
        components: {
          Layout: {
            siderBg: colors.sidebar.bg,
            triggerBg: colors.sidebar.bgElevated,
            headerBg: colors.header.bg,
            headerColor: colors.header.text,
            bodyBg: effectiveAppearance === 'dark' ? '#000000' : '#f5f5f5',
          },
          Menu: siderLight
            ? {
                itemBg: colors.sidebar.bg,
                subMenuItemBg: colors.sidebar.bgElevated,
                itemColor: colors.sidebar.text,
                itemHoverColor: colors.sidebar.textActive,
                itemSelectedColor: colors.sidebar.active,
                itemSelectedBg: colors.sidebar.activeBg,
                itemHoverBg: colors.sidebar.hoverBg,
              }
            : {
                darkItemBg: colors.sidebar.bg,
                darkSubMenuItemBg: colors.sidebar.bgElevated,
                darkItemColor: colors.sidebar.text,
                darkItemHoverColor: colors.sidebar.textActive,
                darkItemSelectedColor: colors.sidebar.active,
                darkItemSelectedBg: colors.sidebar.activeBg,
                darkItemHoverBg: colors.sidebar.hoverBg,
              },
        },
      }}
    >
      <AntdApp>
        {children}
        <ThemePicker />
      </AntdApp>
    </ConfigProvider>
  )
}

export default function App() {
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    applyAppConfig()
    useThemeStore.getState().applyCurrent()

    const userStore = useUserStore.getState()
    if (localStorage.getItem('token')) {
      void userStore.loadRegistry()
      startSessionGuard()
    }

    void (async () => {
      try {
        const res = await getPublicConfig()
        applyRemoteAppConfig(res.data)
      } catch {
        /* 后端未启动时沿用本地默认 */
      }
      captureGlobalUiBaseline()
      if (useUserStore.getState().token) {
        await useUiPreferenceStore.getState().load()
      }
      useThemeStore.getState().applyCurrent()
      setBooting(false)
    })()
  }, [])

  if (booting) {
    return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" tip="初始化配置..." />
      </div>
    )
  }

  return (
    <AntdThemeBridge>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AntdThemeBridge>
  )
}
