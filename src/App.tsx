import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { App as AntdApp, ConfigProvider, Spin, theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import type { Locale } from 'antd/es/locale'
import AppRouter from '@/router'
import {
  applyAppConfig,
  applyRemoteAppConfig,
  captureGlobalUiBaseline,
  appConfig,
  subscribeAppConfig,
  type AntdLocale,
} from '@/config/app'
import { isLightColor } from '@/utils/color'
import { getPublicConfig } from '@/api/system-config'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useUiPreferenceStore } from '@/stores/uiPreference'
import { startSessionGuard } from '@/utils/session-guard'
import XnThemePicker from '@/components/XnThemePicker'

function mapAntdLocale(locale: AntdLocale | string | undefined): Locale {
  return locale === 'en' ? enUS : zhCN
}

function AntdThemeBridge({ children }: { children: ReactNode }) {
  const currentTheme = useThemeStore((s) => s.currentTheme)
  const effectiveAppearance = useThemeStore((s) => s.effectiveAppearance)
  const [, setConfigTick] = useState(0)
  useEffect(() => subscribeAppConfig(() => setConfigTick((n) => n + 1)), [])
  const colors = currentTheme.colors
  const primary = colors.primary
  const siderLight = isLightColor(colors.sidebar.bg)
  const antd = appConfig.ui.antd

  return (
    <ConfigProvider
      locale={mapAntdLocale(antd.locale)}
      componentSize={antd.componentSize}
      prefixCls={antd.prefixCls || 'ant'}
      button={{ autoInsertSpace: antd.button.autoInsertSpace }}
      modal={{ centered: antd.modal.centered }}
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
      <AntdApp message={{ maxCount: antd.message.maxCount }}>
        {children}
        <XnThemePicker />
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
        <Spin size="large" description="初始化配置..." />
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
