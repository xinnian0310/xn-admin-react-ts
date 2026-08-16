/**
 * 主题：外观模式走中性色板 + 拂晓蓝；内置主题走 Ant Design 官方 12 色板。
 * 主色取 color-6，侧栏取同色系 color-8，顶栏相对侧栏略提亮。
 */
import {
  blue,
  cyan,
  geekblue,
  gold,
  green,
  lime,
  magenta,
  orange,
  purple,
  red,
  volcano,
  yellow,
} from '@ant-design/colors'
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
  /** 色板语义，如「斗志、奔放」 */
  tags?: string
  /** 官方 10 阶，供选择器色卡预览 */
  palette: string[]
  swatches: [string, string]
  colors: ThemeColors
}

export const CUSTOM_THEME_ID = 'custom'
export type ThemeSource = 'preset' | 'appearance' | 'custom'
export const DEFAULT_THEME_SOURCE: ThemeSource = 'appearance'

/** Ant Design 设计规范中性色（13 阶） */
export const ANTD_GRAY = {
  1: '#ffffff',
  2: '#fafafa',
  3: '#f5f5f5',
  4: '#f0f0f0',
  5: '#d9d9d9',
  6: '#bfbfbf',
  7: '#8c8c8c',
  8: '#595959',
  9: '#434343',
  10: '#262626',
  11: '#1f1f1f',
  12: '#141414',
  13: '#000000',
} as const

/** 暗色描边（token colorBorderSecondary） */
export const ANTD_DARK_BORDER = '#303030'

/** Ant Design 默认主色 / Pro 深色侧栏 */
export const ANTD_PRIMARY = blue[5]
export const ANTD_SIDER_BG = '#001529'

export const DEFAULT_CUSTOM_PARTS: CustomThemeParts = {
  primary: ANTD_PRIMARY,
  sidebarBg: ANTD_SIDER_BG,
  headerBg: mixHex(ANTD_SIDER_BG, '#ffffff', 0.18),
}

/** 旧主题 id → 官方色板 id */
const THEME_ID_ALIASES: Record<string, string> = {
  'tech-blue': 'geekblue',
  indigo: 'geekblue',
  teal: 'cyan',
  emerald: 'green',
  violet: 'purple',
  amber: 'gold',
  rose: 'magenta',
  slate: 'blue',
  sky: 'blue',
  daybreak: 'blue',
  dawn: 'blue',
}

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

/** 官方浅色顶栏（中性色板 gray-1 / gray-4） */
function antdLightHeader(): ThemeColors['header'] {
  return {
    bg: ANTD_GRAY[1],
    text: 'rgba(0, 0, 0, 0.88)',
    border: ANTD_GRAY[4],
  }
}

/** 内置主题顶栏：相对侧栏略提亮，仍属同一色系 */
function liftHeader(siderBg: string, whiteMix = 0.18): ThemeColors['header'] {
  const bg = mixHex(siderBg, '#ffffff', whiteMix)
  const light = isLightColor(bg)
  return {
    bg,
    text: light ? 'rgba(0, 0, 0, 0.88)' : 'rgba(255, 255, 255, 0.92)',
    border: light ? mixHex(bg, '#000000', 0.06) : 'rgba(255, 255, 255, 0.1)',
  }
}

/** 官方浅色侧栏：白底 + color-1 选中底 + color-6 文字 */
function antdLightSider(primary: string, tint: string): ThemeColors['sidebar'] {
  return {
    bg: ANTD_GRAY[1],
    bgElevated: ANTD_GRAY[2],
    text: 'rgba(0, 0, 0, 0.65)',
    textActive: 'rgba(0, 0, 0, 0.88)',
    active: primary,
    activeBg: tint,
    hoverBg: 'rgba(0, 0, 0, 0.04)',
    border: ANTD_GRAY[4],
    railBg: ANTD_GRAY[2],
  }
}

/** 官方暗色侧栏（中性色板 gray-12 / gray-11） */
function antdDarkSider(primary: string): ThemeColors['sidebar'] {
  return {
    bg: ANTD_GRAY[12],
    bgElevated: ANTD_GRAY[11],
    text: 'rgba(255, 255, 255, 0.65)',
    textActive: '#ffffff',
    active: primary,
    activeBg: `rgba(${hexToRgbCss(primary)}, 0.2)`,
    hoverBg: 'rgba(255, 255, 255, 0.08)',
    border: ANTD_DARK_BORDER,
    railBg: ANTD_GRAY[13],
  }
}

function antdDarkHeader(): ThemeColors['header'] {
  return {
    bg: ANTD_GRAY[11],
    text: 'rgba(255, 255, 255, 0.85)',
    border: ANTD_DARK_BORDER,
  }
}

function fromPalette(
  id: string,
  name: string,
  tags: string,
  palette: readonly string[],
  siderBg = palette[8],
): AppTheme {
  const colors = [...palette]
  const primary = colors[5]
  return {
    id,
    name,
    tags,
    palette: colors,
    swatches: [siderBg, mixHex(siderBg, '#ffffff', 0.18)],
    colors: {
      primary,
      sidebar: darkSider(primary, siderBg),
      header: liftHeader(siderBg),
    },
  }
}

export const appearanceThemes: Record<AppearanceMode, AppTheme> = {
  light: {
    id: 'appearance-light',
    name: '亮色',
    tags: '中性色板 · 拂晓蓝',
    palette: [...blue],
    swatches: [ANTD_GRAY[1], ANTD_GRAY[3]],
    colors: {
      primary: ANTD_PRIMARY,
      sidebar: antdLightSider(ANTD_PRIMARY, blue[0]),
      header: antdLightHeader(),
    },
  },
  dark: {
    id: 'appearance-dark',
    name: '暗色',
    tags: '中性色板 · 拂晓蓝',
    palette: [...blue],
    swatches: [ANTD_GRAY[12], ANTD_GRAY[11]],
    colors: {
      primary: ANTD_PRIMARY,
      sidebar: antdDarkSider(ANTD_PRIMARY),
      header: antdDarkHeader(),
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
      activeBg: sidebarLight ? `rgba(${hexToRgbCss(primary)}, 0.12)` : primary,
      hoverBg: sidebarLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
      border: sidebarLight ? ANTD_GRAY[4] : 'transparent',
      railBg: mixHex(sidebarBg, sidebarLight ? '#000000' : '#ffffff', 0.1),
    },
    header: {
      bg: headerBg,
      text: headerLight ? 'rgba(0, 0, 0, 0.88)' : 'rgba(255, 255, 255, 0.85)',
      border: headerLight ? ANTD_GRAY[4] : 'rgba(255, 255, 255, 0.1)',
    },
  }
}

/** 官方 12 色板，顺序与设计文档一致；拂晓蓝侧栏用 Pro 默认 */
export const builtinThemes: AppTheme[] = [
  fromPalette('red', '薄暮', '斗志、奔放', red),
  fromPalette('volcano', '火山', '醒目、澎湃', volcano),
  fromPalette('orange', '日暮', '温暖、欢快', orange),
  fromPalette('gold', '金盏花', '活力、积极', gold),
  fromPalette('yellow', '日出', '出生、阳光', yellow),
  fromPalette('lime', '青柠', '自然、生机', lime),
  fromPalette('green', '极光绿', '健康、创新', green),
  fromPalette('cyan', '明青', '希望、坚强', cyan),
  fromPalette('blue', '拂晓蓝', '包容、科技、普惠', blue, ANTD_SIDER_BG),
  fromPalette('geekblue', '极客蓝', '探索、钻研', geekblue),
  fromPalette('purple', '酱紫', '优雅、浪漫', purple),
  fromPalette('magenta', '法式洋红', '明快、感性', magenta),
]

export const DEFAULT_THEME_ID = 'blue'

export function findTheme(id: string): AppTheme {
  const resolved = THEME_ID_ALIASES[id] ?? id
  return (
    builtinThemes.find((t) => t.id === resolved) ??
    builtinThemes.find((t) => t.id === DEFAULT_THEME_ID)!
  )
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
      palette: [],
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
