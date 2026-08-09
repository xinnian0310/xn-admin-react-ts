/** 内置主题：侧栏 / 顶栏 / 主色（与 xn-admin-vue3-ts 共享预设；默认 blue 保留 Ant Design 原生色） */

import { hexToRgbCss, isLightColor, mixHex } from '@/utils/color'

export type AppearanceMode = 'light' | 'dark'

export interface ThemeColors {
  primary: string
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

export interface CustomThemeParts {
  primary: string
  sidebarBg: string
  headerBg: string
}

export interface AppTheme {
  id: string
  name: string
  swatches: [string, string]
  colors: ThemeColors
}

export const CUSTOM_THEME_ID = 'custom'
export type ThemeSource = 'preset' | 'appearance' | 'custom'
export const DEFAULT_THEME_SOURCE: ThemeSource = 'preset'

/** Ant Design 默认主色 / Pro 深色侧栏 */
export const ANTD_PRIMARY = '#1677ff'
export const ANTD_SIDER_BG = '#001529'

export const DEFAULT_CUSTOM_PARTS: CustomThemeParts = {
  primary: ANTD_PRIMARY,
  sidebarBg: ANTD_SIDER_BG,
  headerBg: mixHex(ANTD_SIDER_BG, '#ffffff', 0.14),
}

/** 旧主题 id → 新共享 id（两栈统一后兼容 localStorage） */
const THEME_ID_ALIASES: Record<string, string> = {
  'tech-blue': 'indigo',
  cyan: 'teal',
  green: 'emerald',
  purple: 'violet',
  orange: 'amber',
  magenta: 'rose',
  daybreak: 'sky',
  dawn: 'sky',
}

/** 从完整主题提取个性化三项，便于预设切换后同步取色器 */
export function themeToCustomParts(theme: AppTheme): CustomThemeParts {
  return {
    primary: theme.colors.primary,
    sidebarBg: theme.colors.sidebar.bg,
    headerBg: theme.colors.header.bg,
  }
}

/** Pro 深色侧栏：底色可定制，选中项用主色块 */
function darkSider(primary: string, siderBg: string): ThemeColors['sidebar'] {
  return {
    bg: siderBg,
    bgElevated: mixHex(siderBg, '#ffffff', 0.06),
    text: 'rgba(255, 255, 255, 0.65)',
    textActive: '#ffffff',
    active: '#ffffff',
    activeBg: primary,
    hoverBg: 'rgba(255, 255, 255, 0.08)',
    border: 'transparent',
    railBg: mixHex(siderBg, '#000000', 0.35),
  }
}

/** 品牌色侧栏：侧栏即主色系，选中用半透明白 */
function brandSider(bg: string): ThemeColors['sidebar'] {
  return {
    bg,
    bgElevated: mixHex(bg, '#000000', 0.1),
    text: 'rgba(255, 255, 255, 0.85)',
    textActive: '#ffffff',
    active: '#ffffff',
    activeBg: 'rgba(255, 255, 255, 0.22)',
    hoverBg: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.14)',
    railBg: mixHex(bg, '#000000', 0.22),
  }
}

/** 浅色侧栏：浅底 + 主色高亮 */
function softSider(primary: string, siderBg: string): ThemeColors['sidebar'] {
  return {
    bg: siderBg,
    bgElevated: mixHex(siderBg, '#ffffff', 0.45),
    text: 'rgba(15, 23, 42, 0.65)',
    textActive: 'rgba(15, 23, 42, 0.92)',
    active: primary,
    activeBg: `rgba(${hexToRgbCss(primary)}, 0.12)`,
    hoverBg: 'rgba(15, 23, 42, 0.05)',
    border: mixHex(siderBg, '#000000', 0.08),
    railBg: mixHex(siderBg, '#000000', 0.04),
  }
}

/** 顶栏：相对侧栏只略提亮，色差保持很小 */
function liftHeader(siderBg: string, whiteMix = 0.14): ThemeColors['header'] {
  const bg = mixHex(siderBg, '#ffffff', whiteMix)
  const light = isLightColor(bg)
  return {
    bg,
    text: light ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)',
    border: light ? mixHex(bg, '#000000', 0.06) : 'rgba(255, 255, 255, 0.1)',
  }
}

export const appearanceThemes: Record<AppearanceMode, AppTheme> = {
  light: {
    id: 'appearance-light',
    name: '亮色',
    swatches: ['#d6e4ff', '#e6f4ff'],
    colors: {
      primary: ANTD_PRIMARY,
      sidebar: softSider(ANTD_PRIMARY, '#d6e4ff'),
      header: liftHeader('#d6e4ff', 0.12),
    },
  },
  dark: {
    id: 'appearance-dark',
    name: '暗色',
    swatches: ['#141414', '#1f1f1f'],
    colors: {
      primary: ANTD_PRIMARY,
      sidebar: {
        bg: '#141414',
        bgElevated: '#1f1f1f',
        text: 'rgba(255, 255, 255, 0.65)',
        textActive: '#ffffff',
        active: ANTD_PRIMARY,
        activeBg: 'rgba(22, 119, 255, 0.25)',
        hoverBg: 'rgba(255, 255, 255, 0.08)',
        border: '#303030',
        railBg: '#000000',
      },
      header: liftHeader('#141414', 0.12),
    },
  },
}

export function buildThemeColorsFromParts(parts: CustomThemeParts): ThemeColors {
  const { primary, sidebarBg, headerBg } = parts
  const sidebarLight = isLightColor(sidebarBg)
  const headerLight = isLightColor(headerBg)

  return {
    primary,
    sidebar: {
      bg: sidebarBg,
      bgElevated: mixHex(sidebarBg, sidebarLight ? '#000000' : '#ffffff', 0.08),
      text: sidebarLight ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.65)',
      textActive: sidebarLight ? 'rgba(15, 23, 42, 0.92)' : '#ffffff',
      active: sidebarLight ? primary : '#ffffff',
      activeBg: sidebarLight ? `rgba(${hexToRgbCss(primary)}, 0.12)` : primary,
      hoverBg: sidebarLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.08)',
      border: sidebarLight ? mixHex(sidebarBg, '#000000', 0.08) : 'transparent',
      railBg: mixHex(sidebarBg, sidebarLight ? '#000000' : '#ffffff', 0.1),
    },
    header: {
      bg: headerBg,
      text: headerLight ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)',
      border: headerLight ? mixHex(headerBg, '#000000', 0.06) : 'rgba(255, 255, 255, 0.1)',
    },
  }
}

/** 共享预设（与 Vue 端 id / 色值一致；blue 为各自框架默认） */
export const builtinThemes: AppTheme[] = [
  {
    id: 'blue',
    name: 'Ant Design',
    swatches: [ANTD_SIDER_BG, mixHex(ANTD_SIDER_BG, '#ffffff', 0.14)],
    colors: {
      primary: ANTD_PRIMARY,
      sidebar: darkSider(ANTD_PRIMARY, ANTD_SIDER_BG),
      header: liftHeader(ANTD_SIDER_BG),
    },
  },
  {
    id: 'indigo',
    name: '靛蓝',
    swatches: ['#312e81', mixHex('#312e81', '#ffffff', 0.14)],
    colors: {
      primary: '#6366f1',
      sidebar: darkSider('#6366f1', '#312e81'),
      header: liftHeader('#312e81'),
    },
  },
  {
    id: 'teal',
    name: '青碧',
    swatches: ['#0f766e', mixHex('#0f766e', '#ffffff', 0.14)],
    colors: {
      primary: '#14b8a6',
      sidebar: brandSider('#0f766e'),
      header: liftHeader('#0f766e'),
    },
  },
  {
    id: 'emerald',
    name: '翠绿',
    swatches: ['#065f46', mixHex('#065f46', '#ffffff', 0.14)],
    colors: {
      primary: '#10b981',
      sidebar: brandSider('#065f46'),
      header: liftHeader('#065f46'),
    },
  },
  {
    id: 'violet',
    name: '紫罗兰',
    swatches: ['#5b21b6', mixHex('#5b21b6', '#ffffff', 0.14)],
    colors: {
      primary: '#8b5cf6',
      sidebar: brandSider('#5b21b6'),
      header: liftHeader('#5b21b6'),
    },
  },
  {
    id: 'amber',
    name: '琥珀',
    swatches: ['#92400e', mixHex('#92400e', '#ffffff', 0.14)],
    colors: {
      primary: '#f59e0b',
      sidebar: brandSider('#92400e'),
      header: liftHeader('#92400e'),
    },
  },
  {
    id: 'rose',
    name: '玫红',
    swatches: ['#9f1239', mixHex('#9f1239', '#ffffff', 0.14)],
    colors: {
      primary: '#e11d48',
      sidebar: brandSider('#9f1239'),
      header: liftHeader('#9f1239'),
    },
  },
  {
    id: 'slate',
    name: '深空灰',
    swatches: ['#1e293b', mixHex('#1e293b', '#ffffff', 0.14)],
    colors: {
      primary: '#64748b',
      sidebar: darkSider('#64748b', '#1e293b'),
      header: liftHeader('#1e293b'),
    },
  },
  {
    id: 'sky',
    name: '晴空',
    swatches: ['#bae6fd', mixHex('#bae6fd', '#ffffff', 0.14)],
    colors: {
      primary: '#0ea5e9',
      sidebar: softSider('#0ea5e9', '#bae6fd'),
      header: liftHeader('#bae6fd'),
    },
  },
]

export const DEFAULT_THEME_ID = 'blue'

export function findTheme(id: string): AppTheme {
  const resolved = THEME_ID_ALIASES[id] ?? id
  return builtinThemes.find((t) => t.id === resolved) ?? builtinThemes[0]
}

export function findAppearanceTheme(mode: AppearanceMode): AppTheme {
  return appearanceThemes[mode]
}

export interface ResolveThemeInput {
  source: ThemeSource
  themeId: string
  appearance: AppearanceMode
  customParts: CustomThemeParts
}

export function resolveActiveTheme(input: ResolveThemeInput): AppTheme {
  if (input.source === 'appearance') {
    return findAppearanceTheme(input.appearance)
  }
  if (input.source === 'custom') {
    const colors = buildThemeColorsFromParts(input.customParts)
    return {
      id: CUSTOM_THEME_ID,
      name: '个性化',
      swatches: [input.customParts.sidebarBg, input.customParts.primary],
      colors,
    }
  }
  return findTheme(input.themeId)
}

export function resolveThemeColors(themeId: string, customParts: CustomThemeParts): ThemeColors {
  if (themeId === CUSTOM_THEME_ID) {
    return buildThemeColorsFromParts(customParts)
  }
  return findTheme(themeId).colors
}
