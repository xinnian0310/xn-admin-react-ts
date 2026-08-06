import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export type PageComponent = ComponentType<object>
export type LazyPage = LazyExoticComponent<PageComponent>

const pageModules = import.meta.glob<{ default: PageComponent }>('@/pages/**/{index,save}.tsx')

function NotFoundFallback() {
  return lazy(() => import('@/pages/error/NotFoundView'))
}

/** 加载 pages 下 index.tsx，路径 /system/roles -> pages/system/roles/index.tsx */
export function loadIndexView(routePath: string): LazyPage {
  const viewDir = routePath.replace(/^\//, '')
  const key = `/src/pages/${viewDir}/index.tsx`
  const loader = pageModules[key]
  if (!loader) {
    console.warn(`[view-loader] 未找到页面: pages/${viewDir}/index.tsx`)
    return NotFoundFallback()
  }
  return lazy(loader)
}

/** 加载 pages 下 save.tsx */
export function loadSaveView(routePath: string): LazyPage {
  const basePath = routePath.replace(/\/save(\/.*)?$/, '').replace(/^\//, '')
  const key = `/src/pages/${basePath}/save.tsx`
  const loader = pageModules[key]
  if (!loader) {
    console.warn(`[view-loader] 未找到页面: pages/${basePath}/save.tsx`)
    return NotFoundFallback()
  }
  return lazy(loader)
}

export function hasIndexView(routePath: string): boolean {
  const viewDir = routePath.replace(/^\//, '')
  return `/src/pages/${viewDir}/index.tsx` in pageModules
}

export function listAvailableViews(): string[] {
  return Object.keys(pageModules).map((k) => k.replace('/src/pages/', 'pages/'))
}

export interface DynamicRouteMeta {
  title?: string
  icon?: string
  permission?: string
  affix?: boolean
  hidden?: boolean
  public?: boolean
  noCache?: boolean
  routePath?: string
}

export interface DynamicRouteObject {
  path: string
  name: string
  Component: LazyPage
  meta: DynamicRouteMeta
}

/** 根据菜单路由记录生成 React 动态路由描述 */
export function buildRouteRecord(
  routePath: string,
  meta: DynamicRouteMeta = {},
): DynamicRouteObject {
  const path = routePath.replace(/^\//, '')
  return {
    path,
    name: path.replace(/\//g, '-'),
    Component: loadIndexView(routePath),
    meta: { ...meta, routePath },
  }
}

export { pageModules }
