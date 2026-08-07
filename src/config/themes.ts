/** 内置主题：侧栏 / 顶栏 / 主色（各预设侧栏色明显区分，避免清一色 #001529） */

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

export const ANTD_PRIMARY = '#1677ff'
export const ANTD_SIDER_BG = '#001529'

export const DEFAULT_CUSTOM_PARTS: CustomThemeParts = {
  primary: ANTD_PRIMARY,
  sidebarBg: ANTD_SIDER_BG,
  headerBg: mixHex(ANTD_SIDER_BG, '#ffffff', 0.14),
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
    text: 'rgba(0, 0, 0, 0.65)',
    textActive: 'rgba(0, 0, 0, 0.88)',
    active: primary,
    activeBg: `rgba(${hexToRgbCss(primary)}, 0.12)`,
    hoverBg: 'rgba(0, 0, 0, 0.04)',
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
    text: light ? 'rgba(0, 0, 0, 0.88)' : 'rgba(255, 255, 255, 0.92)',
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
      text: sidebarLight ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.65)',
      textActive: sidebarLight ? 'rgba(0, 0, 0, 0.88)' : '#ffffff',
      active: sidebarLight ? primary : '#ffffff',
      activeBg: sidebarLight ? `rgba(${hexToRgbCss(primary)}, 0.1)` : primary,
      hoverBg: sidebarLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
      border: sidebarLight ? '#f0f0f0' : 'transparent',
      railBg: mixHex(sidebarBg, sidebarLight ? '#000000' : '#ffffff', 0.1),
    },
    header: {
      bg: headerBg,
      text: headerLight ? 'rgba(0, 0, 0, 0.88)' : 'rgba(255, 255, 255, 0.85)',
      border: headerLight ? '#f0f0f0' : 'rgba(255, 255, 255, 0.12)',
    },
  }
}

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
    id: 'tech-blue',
    name: '极客蓝',
    swatches: ['#0958d9', mixHex('#0958d9', '#ffffff', 0.14)],
    colors: {
      primary: '#1677ff',
      sidebar: brandSider('#0958d9'),
      header: liftHeader('#0958d9'),
    },
  },
  {
    id: 'cyan',
    name: '明青',
    swatches: ['#006d75', mixHex('#006d75', '#ffffff', 0.14)],
    colors: {
      primary: '#13c2c2',
      sidebar: brandSider('#006d75'),
      header: liftHeader('#006d75'),
    },
  },
  {
    id: 'green',
    name: '极光绿',
    swatches: ['#237804', mixHex('#237804', '#ffffff', 0.14)],
    colors: {
      primary: '#52c41a',
      sidebar: brandSider('#237804'),
      header: liftHeader('#237804'),
    },
  },
  {
    id: 'purple',
    name: '酱紫',
    swatches: ['#391085', mixHex('#391085', '#ffffff', 0.14)],
    colors: {
      primary: '#722ed1',
      sidebar: brandSider('#391085'),
      header: liftHeader('#391085'),
    },
  },
  {
    id: 'orange',
    name: '日落橙',
    swatches: ['#ad4e00', mixHex('#ad4e00', '#ffffff', 0.14)],
    colors: {
      primary: '#fa8c16',
      sidebar: brandSider('#ad4e00'),
      header: liftHeader('#ad4e00'),
    },
  },
  {
    id: 'magenta',
    name: '薄暮',
    swatches: ['#9e1068', mixHex('#9e1068', '#ffffff', 0.14)],
    colors: {
      primary: '#eb2f96',
      sidebar: brandSider('#9e1068'),
      header: liftHeader('#9e1068'),
    },
  },
  {
    id: 'sky',
    name: '晴空',
    swatches: ['#91caff', mixHex('#91caff', '#ffffff', 0.14)],
    colors: {
      primary: '#1677ff',
      sidebar: softSider('#1677ff', '#91caff'),
      header: liftHeader('#91caff'),
    },
  },
  {
    id: 'daybreak',
    name: '拂晓灰',
    swatches: ['#d9d9d9', mixHex('#d9d9d9', '#ffffff', 0.14)],
    colors: {
      primary: ANTD_PRIMARY,
      sidebar: softSider(ANTD_PRIMARY, '#d9d9d9'),
      header: liftHeader('#d9d9d9'),
    },
  },
]

export const DEFAULT_THEME_ID = 'blue'

export function findTheme(id: string): AppTheme {
  return builtinThemes.find((t) => t.id === id) ?? builtinThemes[0]
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
