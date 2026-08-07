import { lazy } from 'react'
import { useMenuStore, collectMenuPaths } from '@/stores/menu'
import { buildRouteRecord, type DynamicRouteObject } from '@/utils/view-loader'

const iframePage = lazy(() => import('@/pages/common/iframe/index'))

let registerPromise: Promise<void> | null = null
let dynamicRoutes: DynamicRouteObject[] = []
let catchAllReady = false

function buildDynamicRoutes() {
  const menuStore = useMenuStore.getState()
  const paths = collectMenuPaths(menuStore.sysRoutes)
  const next: DynamicRouteObject[] = []

  for (const route of paths) {
    if (!route.path) continue
    const routeName = route.path.replace(/^\//, '').replace(/\//g, '-')
    if (routeName === 'dashboard') continue

    const meta = {
      title: route.title,
      icon: route.icon,
      permission: route.permissionControl ? route.permission : undefined,
      affix: route.affix,
      linkUrl: route.type === 'LINK' ? route.linkUrl : undefined,
    }

    if (route.type === 'LINK') {
      const path = route.path.replace(/^\//, '')
      next.push({
        path,
        name: routeName,
        Component: iframePage,
        meta: { ...meta, routePath: route.path },
      })
    } else {
      next.push(buildRouteRecord(route.path, meta))
    }
  }
  dynamicRoutes = next
}

export function getDynamicRouteObjects(): DynamicRouteObject[] {
  return dynamicRoutes
}

export function isCatchAllReady(): boolean {
  return catchAllReady
}

export async function registerDynamicRoutes() {
  const menuStore = useMenuStore.getState()
  if (menuStore.routesRegistered) {
    return
  }

  if (registerPromise) {
    return registerPromise
  }

  registerPromise = (async () => {
    try {
      await useMenuStore.getState().fetchMenus()
      buildDynamicRoutes()
    } catch (error) {
      console.error('[route-register] 菜单加载失败，将仅使用静态路由', error)
      useMenuStore.getState().markMenuLoadFailed()
      dynamicRoutes = []
    } finally {
      catchAllReady = true
      useMenuStore.getState().markRoutesRegistered()
      registerPromise = null
    }
  })()

  return registerPromise
}

export function resetDynamicRoutes() {
  registerPromise = null
  dynamicRoutes = []
  catchAllReady = false
  useMenuStore.getState().reset()
}
