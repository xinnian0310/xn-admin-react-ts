/**
 * 应用全局配置
 *
 * - 本地默认值在此定义；后端「系统配置」启动时 merge 覆盖
 * - 应用介绍只保留 intro：本地留空，公开接口按 clientId 投影后写入
 * - 多前端隔离存于云端 app.clients，前端配置与运行时不挂 clients
 * - UI 行为、布局字号集中管理；本工程仅 ui.antd（Ant Design）
 * - 主题色由 theme store 管理
 */
import type { AppearanceMode, ThemeColors, ThemeSource } from '@/config/themes'
import {
  ANTD_DARK_BORDER,
  ANTD_GRAY,
  DEFAULT_CUSTOM_PARTS,
  DEFAULT_THEME_ID,
  DEFAULT_THEME_SOURCE,
  resolveActiveTheme,
  type CustomThemeParts,
} from '@/config/themes'
import { buildPrimaryScale, mixHex } from '@/utils/color'

/** 与后端 AppConfigVO.ui.antd 对齐（Ant Design 原生命名） */
export type AntdLocale = 'zh-cn' | 'en'
export type AntdComponentSize = 'large' | 'middle' | 'small'
/** 后台整体布局：side 左侧 | top 顶部 | mix 顶+侧 | columns 双列侧栏 */
export type LayoutMode = 'side' | 'top' | 'mix' | 'columns'

/** 本地默认（与后端 AppConfigVO 默认值保持一致） */
export const defaultAppConfig = {
  app: {
    name: '心念后台管理系统（React）',
    /** 应用介绍：本地留空，由公开配置按 client 投影后写入 */
    intro: '',
    favicon: '/xinnian-tech-logo.png',
    logo: '/xinnian-tech-logo.png',
    logoWidth: 28 as number | null,
    logoHeight: null as number | null,
    footer: '心念后台管理系统 · 心念科技 · Copyright © 2026',
  },
  session: {
    idleLogoutEnabled: true,
    idleTimeoutMs: 30 * 60 * 1000,
    slidingRefreshEnabled: true,
    refreshIntervalMs: 5 * 60 * 1000,
    idleCheckIntervalMs: 30 * 1000,
  },
  ui: {
    dialog: {
      /** 弹窗整体限高；超出只滚 .ant-modal-body，不带动页面 */
      maxHeight: '80vh',
    },
    layout: {
      mode: 'side' as LayoutMode,
      /** 默认对齐 Ant Design Pro：深色侧栏 + 白色顶栏 */
      sidebar: {
        bg: '#001529',
        bgElevated: '#000c17',
        text: 'rgba(255, 255, 255, 0.65)',
        textActive: '#ffffff',
        active: '#ffffff',
        activeBg: '#1677ff',
        hoverBg: 'rgba(255, 255, 255, 0.08)',
        border: 'transparent',
        railBg: '#000c17',
      },
      header: {
        bg: '#ffffff',
        text: 'rgba(0, 0, 0, 0.88)',
        border: '#f0f0f0',
      },
    },
    fontSize: {
      sidebar: '14px',
      header: '14px',
      tagsView: '14px',
      main: '14px',
    },
    tagsView: {
      height: '40px',
    },
    /** React Ant Design ConfigProvider / App；字段名与 antd API 对齐 */
    antd: {
      locale: 'zh-cn' as AntdLocale,
      componentSize: 'middle' as AntdComponentSize,
      prefixCls: 'ant',
      button: {
        autoInsertSpace: false,
      },
      message: {
        maxCount: 3,
      },
      modal: {
        centered: true,
        /** 声明式弹窗可拖拽（XnModal）；Modal.confirm 等命令式不受影响 */
        draggable: true,
        /** 与 ui.dialog.maxHeight 同步，XnModal 限高后内部滚动 */
        maxHeight: '80vh',
      },
    },
  },
  storage: {
    /** 同源相对路径：/minio/… → Vite/Nginx 再拼桶名 xn-admin 转到 :9000 */
    minio: '/minio/',
    /** 同源相对路径：/kkFileView/… → Vite/Nginx 反代到 :8012（需 KK_CONTEXT_PATH=/kkFileView） */
    kkFileView: '/kkFileView/',
  },
  logRetention: {
    loginDays: 90,
    operDays: 90,
    exceptionDays: 90,
    jobDays: 90,
  },
  sensitiveData: {
    enabled: true,
    fields: ['phone', 'email'] as string[],
  },
}

export type AppConfig = {
  app: {
    name: string
    intro: string
    favicon: string
    logo: string
    logoWidth: number | null
    logoHeight: number | null
    footer: string
  }
  session: {
    idleLogoutEnabled: boolean
    idleTimeoutMs: number
    slidingRefreshEnabled: boolean
    refreshIntervalMs: number
    idleCheckIntervalMs: number
  }
  ui: {
    dialog: { maxHeight: string }
    layout: {
      mode: LayoutMode
      sidebar: {
        bg: string
        bgElevated: string
        text: string
        textActive: string
        active: string
        activeBg: string
        hoverBg: string
        border: string
        railBg: string
      }
      header: {
        bg: string
        text: string
        border: string
      }
    }
    fontSize: {
      sidebar: string
      header: string
      tagsView: string
      main: string
    }
    tagsView: { height: string }
    antd: {
      locale: AntdLocale
      componentSize: AntdComponentSize
      prefixCls: string
      button: { autoInsertSpace: boolean }
      message: { maxCount: number }
      modal: { centered: boolean; draggable: boolean; maxHeight: string }
    }
  }
  /** 对象存储访问前缀：key=名字，value=路径前缀 */
  storage: Record<string, string>
  logRetention: {
    loginDays: number
    operDays: number
    exceptionDays: number
    jobDays: number
  }
  sensitiveData: {
    enabled: boolean
    fields: string[]
  }
}

function cloneDefault(): AppConfig {
  return JSON.parse(JSON.stringify(defaultAppConfig)) as AppConfig
}

/** 运行时配置（可变普通对象，可被后端下发覆盖） */
export const appConfig: AppConfig = cloneDefault()

const appConfigListeners = new Set<() => void>()

/** 订阅运行时 appConfig 变更（ConfigProvider 等需据此重渲染） */
export function subscribeAppConfig(listener: () => void) {
  appConfigListeners.add(listener)
  return () => {
    appConfigListeners.delete(listener)
  }
}

function notifyAppConfigListeners() {
  appConfigListeners.forEach((fn) => {
    try {
      fn()
    } catch {
      /* ignore */
    }
  })
}

/** 深合并：仅用 remote 中非 undefined 的字段覆盖 target */
export function deepMergeAppConfig<T extends Record<string, unknown>>(
  target: T,
  remote: unknown,
): T {
  if (remote == null || typeof remote !== 'object' || Array.isArray(remote)) {
    return target
  }
  const src = remote as Record<string, unknown>
  for (const key of Object.keys(src)) {
    const value = src[key]
    if (value === undefined) continue
    const current = (target as Record<string, unknown>)[key]
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      current !== null &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      deepMergeAppConfig(current as Record<string, unknown>, value)
    } else {
      ;(target as Record<string, unknown>)[key] = value
    }
  }
  return target
}

/** 用远端配置覆盖运行时 appConfig，并重新 apply 样式 */
export function applyRemoteAppConfig(
  remote: Partial<AppConfig> | Record<string, unknown> | null | undefined,
) {
  if (!remote) return
  const remoteObj = remote as Record<string, unknown>
  const remoteStorage = remoteObj.storage
  const { storage: _ignored, ...rest } = remoteObj
  deepMergeAppConfig(appConfig as unknown as Record<string, unknown>, rest)
  if (remoteStorage && typeof remoteStorage === 'object' && !Array.isArray(remoteStorage)) {
    const entries = Object.entries(remoteStorage as Record<string, unknown>).filter(
      ([k, v]) => !!k?.trim() && typeof v === 'string' && !!v.trim(),
    )
    if (entries.length > 0) {
      for (const key of Object.keys(appConfig.storage)) delete appConfig.storage[key]
      for (const [k, v] of entries) appConfig.storage[k.trim()] = String(v).trim()
    }
  }
  const app = (remote as Partial<AppConfig>).app
  if (app) {
    if ('logoWidth' in app) appConfig.app.logoWidth = app.logoWidth ?? null
    if ('logoHeight' in app) appConfig.app.logoHeight = app.logoHeight ?? null
  }
  // 运行时只用投影后的 name/intro，不保留云端 clients 映射
  delete (appConfig.app as Record<string, unknown>).clients
  // 公开配置可能带他栈字段，不进本工程运行时
  delete (appConfig.ui as Record<string, unknown>).elementPlus
  applyAppConfig(appConfig)
}

/** 拼接对象存储访问前缀；未配置时回落本地默认 */
export function resolveStorageBase(name = 'minio'): string {
  const fromRemote = appConfig.storage?.[name]?.trim()
  if (fromRemote) {
    return fromRemote.endsWith('/') ? fromRemote : `${fromRemote}/`
  }
  const fallback = (defaultAppConfig.storage as Record<string, string>)[name] || ''
  if (!fallback) return ''
  return fallback.endsWith('/') ? fallback : `${fallback}/`
}

/** 用相对对象路径拼完整访问 URL */
export function resolveStorageUrl(objectPath: string, storageName = 'minio'): string {
  const base = resolveStorageBase(storageName)
  const rel = (objectPath || '').replace(/^\/+/, '')
  if (!base) return rel
  return `${base}${rel}`
}

/**
 * 业务附件访问地址：优先远程连接配置 storage.minio（支持 http(s) 或同源相对前缀）；
 * 已是绝对地址或 / 开头路径时原样返回；再兜底本地 uploads。
 */
export function resolveAttachmentUrl(filePath: string, storageName = 'minio'): string {
  const path = (filePath || '').trim()
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('/')) return path
  const remote = resolveStorageUrl(path, storageName)
  if (remote && (/^https?:\/\//i.test(remote) || remote.startsWith('/'))) return remote
  return `/uploads/${path.replace(/^\/+/, '')}`
}

let globalUiBaseline: {
  layoutMode: LayoutMode
  fontSize: AppConfig['ui']['fontSize']
  tagsView: AppConfig['ui']['tagsView']
  dialog: AppConfig['ui']['dialog']
} | null = null

export function captureGlobalUiBaseline(config: AppConfig = appConfig) {
  globalUiBaseline = {
    layoutMode: config.ui.layout.mode,
    fontSize: { ...config.ui.fontSize },
    tagsView: { ...config.ui.tagsView },
    dialog: { ...config.ui.dialog },
  }
}

export type UserUiPreference = {
  layout?: { mode?: LayoutMode }
  fontSize?: Partial<AppConfig['ui']['fontSize']>
  tagsView?: Partial<AppConfig['ui']['tagsView']>
  dialog?: Partial<AppConfig['ui']['dialog']>
}

/** 先恢复全局布局/字号，再叠加个人偏好 */
export function applyUserUiPreference(pref: UserUiPreference | null | undefined) {
  if (globalUiBaseline) {
    appConfig.ui.layout.mode = globalUiBaseline.layoutMode
    Object.assign(appConfig.ui.fontSize, globalUiBaseline.fontSize)
    Object.assign(appConfig.ui.tagsView, globalUiBaseline.tagsView)
    Object.assign(appConfig.ui.dialog, globalUiBaseline.dialog)
  }
  if (pref) {
    if (pref.layout?.mode) appConfig.ui.layout.mode = pref.layout.mode
    if (pref.fontSize) {
      for (const [k, v] of Object.entries(pref.fontSize)) {
        if (v) (appConfig.ui.fontSize as Record<string, string>)[k] = v
      }
    }
    if (pref.tagsView?.height) appConfig.ui.tagsView.height = pref.tagsView.height
    if (pref.dialog?.maxHeight) appConfig.ui.dialog.maxHeight = pref.dialog.maxHeight
  }
  applyAppConfig(appConfig)
}

/** 深拷贝 antd 子树，供表单与 API payload 使用 */
export function cloneAntdUi(
  src: AppConfig['ui']['antd'] = defaultAppConfig.ui.antd,
): AppConfig['ui']['antd'] {
  const base = defaultAppConfig.ui.antd
  return {
    ...base,
    ...src,
    button: { ...base.button, ...src.button },
    message: { ...base.message, ...src.message },
    modal: { ...base.modal, ...src.modal },
  }
}

function applyFavicon(href: string) {
  const path = href.trim()
  if (!path) return

  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.type = path.endsWith('.svg')
    ? 'image/svg+xml'
    : path.endsWith('.png')
      ? 'image/png'
      : 'image/x-icon'
  link.href = path
}

/** 将可影响样式的配置写入 CSS 变量 */
export function applyAppConfig(config: AppConfig = appConfig) {
  document.title = config.app.name
  applyFavicon(config.app.favicon)

  const root = document.documentElement
  const { dialog, fontSize, tagsView } = config.ui
  const dialogMaxHeight = dialog.maxHeight || config.ui.antd.modal.maxHeight || '80vh'
  dialog.maxHeight = dialogMaxHeight
  config.ui.antd.modal.maxHeight = dialogMaxHeight
  root.style.setProperty('--app-dialog-max-height', dialogMaxHeight)
  root.style.setProperty('--app-font-size-sidebar', fontSize.sidebar)
  root.style.setProperty('--app-font-size-header', fontSize.header)
  root.style.setProperty('--app-font-size-tags-view', fontSize.tagsView)
  root.style.setProperty('--app-font-size-main', fontSize.main)
  root.style.setProperty('--app-tags-view-height', tagsView.height)
  if (config.app.logoWidth != null) {
    root.style.setProperty('--app-logo-width', `${config.app.logoWidth}px`)
  } else {
    root.style.removeProperty('--app-logo-width')
  }
  if (config.app.logoHeight != null) {
    root.style.setProperty('--app-logo-height', `${config.app.logoHeight}px`)
  } else {
    root.style.removeProperty('--app-logo-height')
  }

  let source: ThemeSource = DEFAULT_THEME_SOURCE
  let themeId = DEFAULT_THEME_ID
  let appearance: AppearanceMode = 'light'
  let customParts: CustomThemeParts = { ...DEFAULT_CUSTOM_PARTS }
  let mainBgImage: string | null = null
  try {
    const rawSource = localStorage.getItem('xn-theme-source')
    if (rawSource === 'appearance' || rawSource === 'custom' || rawSource === 'preset') {
      source = rawSource
    } else if (localStorage.getItem('xn-theme-id') === 'custom') {
      source = 'custom'
    }
    const rawId = localStorage.getItem('xn-theme-id') || DEFAULT_THEME_ID
    themeId = rawId === 'custom' ? DEFAULT_THEME_ID : rawId
    appearance = (localStorage.getItem('xn-appearance') as AppearanceMode) || 'light'
    const rawParts = localStorage.getItem('xn-theme-custom')
    if (rawParts) customParts = { ...DEFAULT_CUSTOM_PARTS, ...JSON.parse(rawParts) }
    mainBgImage = localStorage.getItem('xn-main-bg-image')
  } catch {
    /* ignore */
  }
  const active = resolveActiveTheme({ source, themeId, appearance, customParts })
  applyLayoutTheme(active.colors, {
    appearance: source === 'appearance' ? appearance : 'light',
    mainBgImage: source === 'custom' ? mainBgImage : null,
    source,
  })
}

export interface ApplyLayoutThemeOptions {
  appearance?: AppearanceMode
  mainBgImage?: string | null
  /** 当前主题来源；外观模式下页签选中态改用侧栏强调色 */
  source?: ThemeSource
}

/** 应用侧栏 / 顶栏 / 主色主题到 CSS 变量（Ant Design；不写 Element --el-*） */
export function applyLayoutTheme(colors: ThemeColors, options: ApplyLayoutThemeOptions = {}) {
  const appearance = options.appearance ?? 'light'
  const mainBgImage = options.mainBgImage ?? null
  const root = document.documentElement
  const dark = appearance === 'dark'

  root.classList.toggle('dark', dark)
  root.style.colorScheme = dark ? 'dark' : 'light'

  const s = colors.sidebar
  root.style.setProperty('--app-sidebar-bg', s.bg)
  root.style.setProperty('--app-sidebar-bg-elevated', s.bgElevated)
  root.style.setProperty('--app-sidebar-text', s.text)
  root.style.setProperty('--app-sidebar-text-active', s.textActive)
  root.style.setProperty('--app-sidebar-active', s.active)
  root.style.setProperty('--app-sidebar-active-bg', s.activeBg)
  root.style.setProperty('--app-sidebar-hover-bg', s.hoverBg)
  root.style.setProperty('--app-sidebar-border', s.border)
  root.style.setProperty('--app-sidebar-rail-bg', s.railBg)

  const h = colors.header
  root.style.setProperty('--app-header-bg', h.bg)
  root.style.setProperty('--app-header-text', h.text)
  root.style.setProperty('--app-header-border', h.border)

  const scale = buildPrimaryScale(colors.primary, appearance)
  root.style.setProperty('--app-color-primary', scale.primary)
  root.style.setProperty('--app-color-primary-light-3', scale['light-3'])
  root.style.setProperty('--app-color-primary-light-5', scale['light-5'])
  root.style.setProperty('--app-color-primary-light-7', scale['light-7'])
  root.style.setProperty('--app-color-primary-light-8', scale['light-8'])
  root.style.setProperty('--app-color-primary-light-9', scale['light-9'])
  root.style.setProperty('--app-color-primary-dark-2', scale['dark-2'])
  root.style.setProperty('--app-color-primary-rgb', scale.rgb)

  // Ant Design CSS 变量（与 ConfigProvider token 互补；不写 --el-*）
  root.style.setProperty('--ant-color-primary', scale.primary)
  root.style.setProperty('--ant-color-primary-hover', scale['light-3'])
  root.style.setProperty('--ant-color-primary-active', scale['dark-2'])
  root.style.setProperty('--ant-color-primary-bg', scale['light-9'])
  root.style.setProperty('--ant-color-primary-border', scale['light-5'])

  if (dark) {
    root.style.setProperty('--app-page-bg', ANTD_GRAY[13])
    root.style.setProperty('--app-main-bg', ANTD_GRAY[12])
    root.style.setProperty('--app-card-bg', ANTD_GRAY[11])
    root.style.setProperty('--app-fill-color', ANTD_GRAY[12])
    root.style.setProperty('--app-tags-bg', ANTD_GRAY[12])
    root.style.setProperty('--app-tags-border', ANTD_DARK_BORDER)
    root.style.setProperty('--app-tags-item-bg', ANTD_GRAY[11])
    root.style.setProperty('--app-tags-item-text', 'rgba(255, 255, 255, 0.65)')
    root.style.setProperty('--app-tags-item-hover-bg', mixHex(colors.primary, '#000000', 0.55))
    root.style.setProperty('--app-tags-item-active-bg', scale.primary)
    root.style.setProperty('--app-tags-item-active-text', '#ffffff')
    root.style.setProperty('--app-tags-scrollbar', ANTD_GRAY[9])
    root.style.setProperty('--app-border-color', ANTD_DARK_BORDER)
    root.style.setProperty('--app-text-muted', 'rgba(255, 255, 255, 0.45)')
    root.style.setProperty('--app-text-primary', 'rgba(255, 255, 255, 0.85)')
    root.style.setProperty('--app-surface-soft', mixHex(colors.primary, '#000000', 0.75))
    root.style.setProperty('--app-surface-soft-border', mixHex(colors.primary, '#000000', 0.45))
    root.style.setProperty('--app-card-hover-border', mixHex(colors.primary, '#000000', 0.3))
  } else {
    root.style.setProperty('--app-page-bg', ANTD_GRAY[3])
    root.style.setProperty('--app-main-bg', ANTD_GRAY[3])
    root.style.setProperty('--app-card-bg', ANTD_GRAY[1])
    root.style.setProperty('--app-fill-color', ANTD_GRAY[2])
    root.style.setProperty('--app-tags-bg', ANTD_GRAY[1])
    root.style.setProperty('--app-tags-border', ANTD_GRAY[4])
    root.style.setProperty('--app-tags-item-bg', ANTD_GRAY[2])
    root.style.setProperty('--app-tags-item-text', 'rgba(0, 0, 0, 0.65)')
    root.style.setProperty('--app-tags-item-hover-bg', scale['light-9'])
    root.style.setProperty('--app-tags-item-active-bg', scale.primary)
    root.style.setProperty('--app-tags-item-active-text', '#ffffff')
    root.style.setProperty('--app-tags-scrollbar', ANTD_GRAY[5])
    root.style.setProperty('--app-border-color', ANTD_GRAY[4])
    root.style.setProperty('--app-text-muted', 'rgba(0, 0, 0, 0.45)')
    root.style.setProperty('--app-text-primary', 'rgba(0, 0, 0, 0.88)')
    root.style.setProperty('--app-surface-soft', scale['light-9'])
    root.style.setProperty('--app-surface-soft-border', scale['light-5'])
    root.style.setProperty('--app-card-hover-border', mixHex(colors.primary, '#ffffff', 0.45))
  }

  // 页签选中态：预设 / 个性化用实心主色；外观模式跟随侧栏强调色（更贴合亮 / 暗观感）
  if (options.source === 'appearance') {
    root.style.setProperty('--app-tags-item-active-bg', colors.sidebar.activeBg)
    root.style.setProperty('--app-tags-item-active-text', colors.sidebar.active)
    root.style.setProperty('--app-tags-item-active-border', colors.sidebar.active)
  } else {
    root.style.setProperty('--app-tags-item-active-border', scale.primary)
  }

  if (mainBgImage) {
    root.style.setProperty('--app-main-bg-image', `url("${mainBgImage}")`)
  } else {
    root.style.setProperty('--app-main-bg-image', 'none')
  }

  notifyAppConfigListeners()
}
