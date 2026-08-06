/** 内置主题：侧栏 / 顶栏 / 主色（Ant Design 气质；各预设侧栏/顶栏可区分） */

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
  headerBg: '#ffffff',
}

/** Pro 深色侧栏：底色可定制，选中项用主色 */
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

function lightHeader(borderColor = '#f0f0f0'): ThemeColors['header'] {
  return {
    bg: '#ffffff',
    text: 'rgba(0, 0, 0, 0.88)',
    border: borderColor,
  }
}

function tintedHeader(primary: string): ThemeColors['header'] {
  return {
    bg: primary,
    text: '#ffffff',
    border: 'transparent',
  }
}

export const appearanceThemes: Record<AppearanceMode, AppTheme> = {
  light: {
    id: 'appearance-light',
    name: '亮色',
    swatches: ['#ffffff', ANTD_PRIMARY],
    colors: {
      primary: ANTD_PRIMARY,
      sidebar: {
        bg: '#ffffff',
        bgElevated: '#fafafa',
        text: 'rgba(0, 0, 0, 0.65)',
        textActive: 'rgba(0, 0, 0, 0.88)',
        active: ANTD_PRIMARY,
        activeBg: '#e6f4ff',
        hoverBg: 'rgba(0, 0, 0, 0.04)',
        border: '#f0f0f0',
        railBg: '#fafafa',
      },
      header: lightHeader(),
    },
  },
  dark: {
    id: 'appearance-dark',
    name: '暗色',
    swatches: ['#141414', ANTD_PRIMARY],
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
      header: {
        bg: '#141414',
        text: 'rgba(255, 255, 255, 0.85)',
        border: '#303030',
      },
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
    swatches: [ANTD_SIDER_BG, ANTD_PRIMARY],
    colors: {
      primary: ANTD_PRIMARY,
      sidebar: darkSider(ANTD_PRIMARY, ANTD_SIDER_BG),
      header: lightHeader(),
    },
  },
  {
    id: 'tech-blue',
    name: '极客蓝',
    swatches: ['#000c17', '#1668dc'],
    colors: {
      primary: '#1668dc',
      sidebar: darkSider('#1668dc', '#000c17'),
      header: tintedHeader('#1668dc'),
    },
  },
  {
    id: 'cyan',
    name: '明青',
    swatches: ['#002329', '#13c2c2'],
    colors: {
      primary: '#13c2c2',
      sidebar: darkSider('#13c2c2', '#002329'),
      header: tintedHeader('#13c2c2'),
    },
  },
  {
    id: 'green',
    name: '极光绿',
    swatches: ['#092b00', '#52c41a'],
    colors: {
      primary: '#52c41a',
      sidebar: darkSider('#52c41a', '#092b00'),
      header: tintedHeader('#52c41a'),
    },
  },
  {
    id: 'purple',
    name: '酱紫',
    swatches: ['#120338', '#722ed1'],
    colors: {
      primary: '#722ed1',
      sidebar: darkSider('#722ed1', '#120338'),
      header: tintedHeader('#722ed1'),
    },
  },
  {
    id: 'daybreak',
    name: '拂晓灰',
    swatches: ['#fafafa', ANTD_PRIMARY],
    colors: {
      primary: ANTD_PRIMARY,
      sidebar: {
        bg: '#fafafa',
        bgElevated: '#ffffff',
        text: 'rgba(0, 0, 0, 0.65)',
        textActive: 'rgba(0, 0, 0, 0.88)',
        active: ANTD_PRIMARY,
        activeBg: '#e6f4ff',
        hoverBg: 'rgba(0, 0, 0, 0.04)',
        border: '#f0f0f0',
        railBg: '#f5f5f5',
      },
      header: lightHeader(),
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
