/** 联系项内容分类 */
export type SiteContactType = 'text' | 'link' | 'email' | 'qq'

export const SITE_CONTACT_TYPE_OPTIONS: { value: SiteContactType; label: string }[] = [
  { value: 'text', label: '文本' },
  { value: 'link', label: '链接' },
  { value: 'email', label: '邮箱' },
  { value: 'qq', label: 'QQ群' },
]

/** QQ 交流群号；full=true 时前台展示删除线与「已满」 */
export interface SiteContactGroup {
  value: string
  full?: boolean
}

export interface SiteContactItem {
  icon?: string
  label: string
  /** 内容分类：决定编辑表单与前台渲染 */
  type?: SiteContactType
  /** 普通联系项内容；QQ群优先用 groups */
  value: string
  link?: string | null
  /** QQ群可配置多个群号 */
  groups?: SiteContactGroup[]
}

export interface SiteDonationQrcode {
  label: string
  src: string
}

export interface SiteDonation {
  tip: string
  qrcodes: SiteDonationQrcode[]
}

export interface SiteContactConfig {
  contacts: SiteContactItem[]
  donation: SiteDonation
}

export function resolveContactType(
  item: Pick<SiteContactItem, 'type' | 'label' | 'link' | 'groups'>,
): SiteContactType {
  if (item.type === 'text' || item.type === 'link' || item.type === 'email' || item.type === 'qq') {
    return item.type
  }
  if (item.label === '交流群' || (item.groups && item.groups.length > 0)) return 'qq'
  if (item.label === '邮箱' || item.link?.startsWith('mailto:')) return 'email'
  if (item.link) return 'link'
  return 'text'
}

export function isQqContact(
  item: Pick<SiteContactItem, 'type' | 'label' | 'link' | 'groups'>,
): boolean {
  return resolveContactType(item) === 'qq'
}

export function contactTypeLabel(type?: SiteContactType): string {
  return SITE_CONTACT_TYPE_OPTIONS.find((o) => o.value === type)?.label || '文本'
}
