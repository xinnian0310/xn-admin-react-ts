/** 颜色工具：主色阶走 Ant Design generate，供主题与业务组件共用 */

import { generate } from '@ant-design/colors'

function clamp(n: number) {
  return Math.min(255, Math.max(0, Math.round(n)))
}

export function parseHex(hex: string): [number, number, number] | null {
  const raw = hex.replace('#', '').trim()
  if (raw.length === 3) {
    const r = parseInt(raw[0] + raw[0], 16)
    const g = parseInt(raw[1] + raw[1], 16)
    const b = parseInt(raw[2] + raw[2], 16)
    return [r, g, b]
  }
  if (raw.length === 6) {
    const r = parseInt(raw.slice(0, 2), 16)
    const g = parseInt(raw.slice(2, 4), 16)
    const b = parseInt(raw.slice(4, 6), 16)
    if ([r, g, b].some((v) => Number.isNaN(v))) return null
    return [r, g, b]
  }
  return null
}

export function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`
}

/** weight: 0=原色，1=纯白/纯黑 */
export function mixHex(hex: string, target: '#ffffff' | '#000000', weight: number) {
  const rgb = parseHex(hex)
  const t = parseHex(target)
  if (!rgb || !t) return hex
  const w = Math.min(1, Math.max(0, weight))
  return toHex(
    rgb[0] + (t[0] - rgb[0]) * w,
    rgb[1] + (t[1] - rgb[1]) * w,
    rgb[2] + (t[2] - rgb[2]) * w,
  )
}

export function hexToRgbCss(hex: string) {
  const rgb = parseHex(hex)
  if (!rgb) return '22, 119, 255'
  return `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`
}

/** WCAG 相对亮度，用于判断侧栏/顶栏该用深色还是浅色文字 */
export function relativeLuminance(hex: string) {
  const rgb = parseHex(hex)
  if (!rgb) return 0
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function isLightColor(hex: string) {
  return relativeLuminance(hex) > 0.55
}

export type PrimaryScale = {
  primary: string
  'light-3': string
  'light-5': string
  'light-7': string
  'light-8': string
  'light-9': string
  'dark-2': string
  rgb: string
}

function scaleFromPalette(palette: string[], fallback: string): PrimaryScale {
  const primary = palette[5] || fallback
  return {
    primary,
    'light-3': palette[4] || mixHex(primary, '#ffffff', 0.3),
    'light-5': palette[3] || mixHex(primary, '#ffffff', 0.5),
    'light-7': palette[2] || mixHex(primary, '#ffffff', 0.7),
    'light-8': palette[1] || mixHex(primary, '#ffffff', 0.8),
    'light-9': palette[0] || mixHex(primary, '#ffffff', 0.9),
    'dark-2': palette[6] || mixHex(primary, '#000000', 0.2),
    rgb: hexToRgbCss(primary),
  }
}

/** 由主色生成 Ant Design 10 阶色板（color-1 ~ color-10） */
export function buildPrimaryScale(primary: string, appearance: 'light' | 'dark' = 'light'): PrimaryScale {
  try {
    const palette = generate(primary, appearance === 'dark' ? { theme: 'dark' } : undefined)
    return scaleFromPalette(palette, primary)
  } catch {
    return scaleFromPalette([], primary)
  }
}
