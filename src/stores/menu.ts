import { create } from 'zustand'
import { getAuthMenus } from '@/api/auth'
import type { SysRoute } from '@/types'
import type { MenuItem } from '@/types/menu'

const RETIRED_MENU_PATHS = new Set(['/ai/models/trial'])

function pruneRetiredRoutes(routes: SysRoute[]): SysRoute[] {
  return routes
    .filter((route) => !RETIRED_MENU_PATHS.has(route.path || ''))
    .map((route) => ({
      ...route,
      children: route.children?.length ? pruneRetiredRoutes(route.children) : route.children,
    }))
}

function routeToMenu(route: SysRoute): MenuItem {
  return {
    id: String(route.id),
    title: route.title,
    icon: route.icon,
    iconAntd: route.iconAntd,
    path: route.type === 'MENU' || route.type === 'LINK' ? route.path : undefined,
    permission: route.permission,
    affix: route.affix,
    hidden: route.hidden,
    children: route.children?.length ? route.children.map(routeToMenu) : undefined,
  }
}

export function collectMenuPaths(routes: SysRoute[]): SysRoute[] {
  const result: SysRoute[] = []
  for (const route of routes) {
    if ((route.type === 'MENU' || route.type === 'LINK') && route.path) {
      result.push(route)
    }
    if (route.children?.length) {
      result.push(...collectMenuPaths(route.children))
    }
  }
  return result
}

interface MenuState {
  menus: MenuItem[]
  sysRoutes: SysRoute[]
  routesRegistered: boolean
  menuLoadFailed: boolean
  fetchMenus: () => Promise<void>
  markMenuLoadFailed: () => void
  reset: () => void
  markRoutesRegistered: () => void
}

let fetchPromise: Promise<void> | null = null

export const useMenuStore = create<MenuState>((set) => ({
  menus: [],
  sysRoutes: [],
  routesRegistered: false,
  menuLoadFailed: false,

  async fetchMenus() {
    if (fetchPromise) return fetchPromise
    fetchPromise = (async () => {
      const res = await getAuthMenus()
      const routes = pruneRetiredRoutes(res.data)
      set({
        sysRoutes: routes,
        menus: routes.map(routeToMenu),
        menuLoadFailed: false,
      })
    })().finally(() => {
      fetchPromise = null
    })
    return fetchPromise
  },

  markMenuLoadFailed() {
    set({ menuLoadFailed: true })
  },

  reset() {
    set({
      menus: [],
      sysRoutes: [],
      routesRegistered: false,
      menuLoadFailed: false,
    })
    fetchPromise = null
  },

  markRoutesRegistered() {
    set({ routesRegistered: true })
  },
}))
