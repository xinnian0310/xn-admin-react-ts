import type { ReactNode } from 'react'
import * as AntIcons from '@ant-design/icons'

export type IconType = 'element' | 'antd' | 'iconify' | 'svg'

export interface ParsedIcon {
  type: IconType
  value: string
  name: string
}

type IconComponent = (props: { style?: React.CSSProperties; className?: string }) => ReactNode

const antdIconMap = AntIcons as unknown as Record<string, IconComponent>

const svgModules = import.meta.glob('../assets/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const svgRawMap = new Map<string, string>()
for (const [path, raw] of Object.entries(svgModules)) {
  const file = path.split('/').pop() || ''
  const name = file.replace(/\.svg$/i, '')
  if (name) svgRawMap.set(name, raw)
}

/** Element Plus 图标名 → Ant Design / Iconify 近似映射 */
const ELEMENT_TO_ICONIFY: Record<string, string> = {
  Lock: 'mdi:lock',
  Guide: 'mdi:routes',
  Brush: 'mdi:brush',
  Monitor: 'mdi:monitor-dashboard',
  Bell: 'mdi:bell',
  Grid: 'mdi:view-grid',
  User: 'mdi:account',
  UserFilled: 'mdi:account',
  Message: 'mdi:email',
  Link: 'mdi:link',
  ChatDotRound: 'mdi:chat',
  Setting: 'mdi:cog',
  HomeFilled: 'mdi:home',
  Menu: 'mdi:menu',
  Search: 'mdi:magnify',
  Plus: 'mdi:plus',
  Edit: 'mdi:pencil',
  Delete: 'mdi:delete',
  View: 'mdi:eye',
  Download: 'mdi:download',
  Upload: 'mdi:upload',
  Refresh: 'mdi:refresh',
  Close: 'mdi:close',
  InfoFilled: 'mdi:information',
  OfficeBuilding: 'mdi:office-building',
  Postcard: 'mdi:card-account-details',
  Key: 'mdi:key',
  Document: 'mdi:file-document',
  Notebook: 'mdi:notebook',
  Collection: 'mdi:folder-multiple',
  Folder: 'mdi:folder',
  FolderOpened: 'mdi:folder-open',
  Files: 'mdi:file-multiple',
  Coin: 'mdi:database',
  DataLine: 'mdi:chart-line',
  DataAnalysis: 'mdi:chart-box',
  Odometer: 'mdi:speedometer',
  Cpu: 'mdi:cpu-64-bit',
  Connection: 'mdi:lan-connect',
  Warning: 'mdi:alert',
  WarningFilled: 'mdi:alert',
  CircleCheck: 'mdi:check-circle',
  CircleClose: 'mdi:close-circle',
  Tools: 'mdi:tools',
  SetUp: 'mdi:tune',
  Operation: 'mdi:cog-transfer',
  List: 'mdi:format-list-bulleted',
  Tickets: 'mdi:ticket',
  Memo: 'mdi:note-text',
  Calendar: 'mdi:calendar',
  Clock: 'mdi:clock-outline',
  Timer: 'mdi:timer',
  Histogram: 'mdi:chart-histogram',
  PieChart: 'mdi:chart-pie',
  TrendCharts: 'mdi:trending-up',
  Platform: 'mdi:application-brackets',
  Iphone: 'mdi:cellphone',
  Cellphone: 'mdi:cellphone',
  Location: 'mdi:map-marker',
  Position: 'mdi:crosshairs-gps',
  Avatar: 'mdi:account-circle',
  Stamp: 'mdi:stamper',
  ScaleToOriginal: 'mdi:arrow-expand-all',
  Expand: 'mdi:arrow-expand',
  Fold: 'mdi:arrow-collapse',
  Rank: 'mdi:sort',
  Sort: 'mdi:sort',
  Filter: 'mdi:filter',
  Share: 'mdi:share-variant',
  Star: 'mdi:star',
  StarFilled: 'mdi:star',
  Flag: 'mdi:flag',
  Box: 'mdi:package-variant',
  Goods: 'mdi:shopping',
  ShoppingCart: 'mdi:cart',
  Wallet: 'mdi:wallet',
  CreditCard: 'mdi:credit-card',
  Money: 'mdi:cash',
  Discount: 'mdi:brightness-percent',
  PriceTag: 'mdi:tag',
  Ticket: 'mdi:ticket-confirmation',
  Present: 'mdi:gift',
  Basketball: 'mdi:basketball',
  Football: 'mdi:soccer',
  Soccer: 'mdi:soccer',
  Baseball: 'mdi:baseball',
  Medal: 'mdi:medal',
  Trophy: 'mdi:trophy',
  FirstAidKit: 'mdi:medical-bag',
  Reading: 'mdi:book-open-page-variant',
  Management: 'mdi:briefcase-account',
  DataBoard: 'mdi:view-dashboard',
  MostlyCloudy: 'mdi:weather-cloudy',
  Sunny: 'mdi:white-balance-sunny',
  Lightning: 'mdi:flash',
  Pouring: 'mdi:weather-pouring',
  Sunrise: 'mdi:weather-sunset-up',
  Sunset: 'mdi:weather-sunset-down',
}

export function parseIcon(value?: string | null): ParsedIcon | null {
  if (!value?.trim()) return null
  const raw = value.trim()

  if (raw.startsWith('svg:')) {
    return { type: 'svg', value: raw, name: raw.slice(4) }
  }
  if (raw.startsWith('antd:') || raw.startsWith('ant:')) {
    const name = raw.slice(raw.indexOf(':') + 1)
    return { type: 'antd', value: raw, name }
  }
  if (raw.startsWith('element:') || raw.startsWith('ep:')) {
    const name = raw.slice(raw.indexOf(':') + 1)
    return { type: 'element', value: name, name }
  }
  if (raw.includes(':')) {
    return { type: 'iconify', value: raw, name: raw }
  }
  return { type: 'element', value: raw, name: raw }
}

export function resolveAntdIcon(name?: string): IconComponent | undefined {
  if (!name) return undefined
  return antdIconMap[name] || antdIconMap[`${name}Outlined`] || antdIconMap[`${name}Filled`]
}

/** 兼容旧调用：返回 Iconify 名或 Ant 组件名字符串，供 XnAppIcon 使用 */
export function resolveIcon(name?: string): string | undefined {
  const parsed = parseIcon(name)
  if (!parsed) return undefined
  if (parsed.type === 'element') {
    return ELEMENT_TO_ICONIFY[parsed.name] || `mdi:${parsed.name.toLowerCase()}`
  }
  if (parsed.type === 'antd') return parsed.name
  return parsed.value
}

export function resolveIconifyName(name?: string): string | undefined {
  const parsed = parseIcon(name)
  if (!parsed) return undefined
  if (parsed.type === 'iconify') return parsed.name
  if (parsed.type === 'element') {
    return ELEMENT_TO_ICONIFY[parsed.name] || `mdi:${parsed.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`
  }
  if (parsed.type === 'antd') return undefined
  return undefined
}

export function listAntdIconNames(): string[] {
  return Object.keys(antdIconMap)
    .filter((k) => /^[A-Z]/.test(k))
    .sort((a, b) => a.localeCompare(b))
}

export function listSvgIconNames(): string[] {
  return Array.from(svgRawMap.keys()).sort((a, b) => a.localeCompare(b))
}

export function getSvgRaw(name: string): string | undefined {
  return svgRawMap.get(name)
}

export function buildIconValue(type: IconType, name: string): string {
  const n = name.trim()
  if (!n) return ''
  if (type === 'svg') return `svg:${n.replace(/^svg:/, '')}`
  if (type === 'iconify') return n
  if (type === 'antd') return `antd:${n.replace(/^(antd|ant):/, '')}`
  return n.replace(/^(element|ep):/, '')
}

export const ICONIFY_PRESETS: string[] = [
  'mdi:home',
  'mdi:view-dashboard',
  'mdi:account',
  'mdi:account-group',
  'mdi:shield-account',
  'mdi:lock',
  'mdi:key',
  'mdi:cog',
  'mdi:menu',
  'mdi:file-tree',
  'mdi:routes',
  'mdi:database',
  'mdi:cloud',
  'mdi:server',
  'mdi:bell',
  'mdi:chart-box',
  'mdi:clipboard-list',
  'mdi:folder',
  'carbon:settings',
  'carbon:user-multiple',
  'carbon:security',
  'carbon:api',
  'ri:dashboard-line',
  'ri:settings-3-line',
  'ri:shield-keyhole-line',
  'ri:route-line',
]

export { antdIconMap as iconMap, ELEMENT_TO_ICONIFY }
