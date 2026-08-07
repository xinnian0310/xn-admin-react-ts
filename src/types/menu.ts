export interface MenuItem {
  id: string
  title: string
  /** Element 图标（兼容） */
  icon?: string
  /** React 优先使用的 Ant/Iconify 图标 */
  iconAntd?: string
  path?: string
  permission?: string
  children?: MenuItem[]
  hidden?: boolean
  affix?: boolean
}

export interface TagView {
  path: string
  name?: string
  title: string
  affix?: boolean
}

/** React Router 路由 meta（与基准 vue-router RouteMeta 对齐） */
export interface AppRouteMeta {
  title?: string
  icon?: string
  public?: boolean
  hidden?: boolean
  affix?: boolean
  activeMenu?: string
  noCache?: boolean
  permission?: string
  routePath?: string
  /** LINK 类型外链地址 */
  linkUrl?: string
}
