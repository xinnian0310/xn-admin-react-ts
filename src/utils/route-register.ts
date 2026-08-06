import { useMenuStore, collectMenuPaths } from '@/stores/menu'
import { buildRouteRecord, type DynamicRouteObject } from '@/utils/view-loader'

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
    next.push(
      buildRouteRecord(route.path, {
        title: route.title,
        icon: route.icon,
        permission: route.permissionControl ? route.permission : undefined,
        affix: route.affix,
      }),
    )
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
