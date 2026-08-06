import { create } from 'zustand'
import type { TagView } from '@/types/menu'
import { getAffixTags } from '@/utils/menu'
import { useMenuStore } from '@/stores/menu'

const STORAGE_KEY = 'xn-tags-view'
const MAX_CACHE = 10

function loadFromStorage(): TagView[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as TagView[]) : []
  } catch {
    return []
  }
}

function saveToStorage(views: TagView[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views))
}

function buildAffixTags(): TagView[] {
  const menus = useMenuStore.getState().menus
  return getAffixTags(menus).map((item) => ({
    path: item.path!,
    title: item.title,
    affix: true,
  }))
}

function pruneCachedViews(visitedViews: TagView[], cachedViews: string[]) {
  const keep = new Set(visitedViews.map((v) => v.name).filter((n): n is string => !!n))
  return cachedViews.filter((name) => keep.has(name))
}

export type TagsViewInput = {
  path: string
  name?: string
  title: string
  affix?: boolean
  noCache?: boolean
  public?: boolean
}

interface TagsViewState {
  visitedViews: TagView[]
  cachedViews: string[]
  isFullscreen: boolean
  initTags: () => void
  addView: (route: TagsViewInput) => void
  addCachedView: (name: string) => void
  delCachedView: (name?: string) => void
  delView: (tag: TagView) => void
  delLeftViews: (tag: TagView) => void
  delRightViews: (tag: TagView) => void
  delOthersViews: (tag: TagView) => void
  delAllViews: () => void
  resetViews: () => void
  setFullscreen: (value: boolean) => void
  toggleFullscreen: () => void
}

export const useTagsViewStore = create<TagsViewState>((set, get) => ({
  visitedViews: loadFromStorage(),
  cachedViews: [],
  isFullscreen: false,

  initTags() {
    const affixTags = buildAffixTags()
    const visited = [...get().visitedViews]
    for (const tag of affixTags) {
      if (!visited.some((v) => v.path === tag.path)) {
        visited.unshift(tag)
      }
    }
    set({ visitedViews: visited })
    saveToStorage(visited)
  },

  addView(route) {
    if (route.public || !route.title) return

    const tag: TagView = {
      path: route.path,
      name: route.name,
      title: route.title,
      affix: route.affix,
    }

    const visited = [...get().visitedViews]
    if (!visited.some((v) => v.path === tag.path)) {
      visited.push(tag)
      set({ visitedViews: visited })
      saveToStorage(visited)
    }

    if (route.name && !route.noCache) {
      get().addCachedView(route.name)
    }
  },

  addCachedView(name) {
    const cached = [...get().cachedViews]
    if (cached.includes(name)) return
    cached.push(name)
    if (cached.length > MAX_CACHE) cached.shift()
    set({ cachedViews: cached })
  },

  delCachedView(name) {
    if (!name) return
    set({ cachedViews: get().cachedViews.filter((n) => n !== name) })
  },

  delView(tag) {
    if (tag.affix) return
    const visited = get().visitedViews.filter((v) => v.path !== tag.path)
    set({ visitedViews: visited })
    saveToStorage(visited)
    if (tag.name) get().delCachedView(tag.name)
  },

  delLeftViews(tag) {
    const index = get().visitedViews.findIndex((v) => v.path === tag.path)
    if (index <= 0) return
    const visited = get().visitedViews.filter((v, i) => i >= index || v.affix)
    set({
      visitedViews: visited,
      cachedViews: pruneCachedViews(visited, get().cachedViews),
    })
    saveToStorage(visited)
  },

  delRightViews(tag) {
    const index = get().visitedViews.findIndex((v) => v.path === tag.path)
    if (index === -1) return
    const visited = get().visitedViews.filter((v, i) => i <= index || v.affix)
    set({
      visitedViews: visited,
      cachedViews: pruneCachedViews(visited, get().cachedViews),
    })
    saveToStorage(visited)
  },

  delOthersViews(tag) {
    const visited = get().visitedViews.filter((v) => v.affix || v.path === tag.path)
    set({
      visitedViews: visited,
      cachedViews: pruneCachedViews(visited, get().cachedViews),
    })
    saveToStorage(visited)
  },

  delAllViews() {
    const visited = get().visitedViews.filter((v) => v.affix)
    set({ visitedViews: visited, cachedViews: [] })
    saveToStorage(visited)
  },

  resetViews() {
    set({ visitedViews: [], cachedViews: [], isFullscreen: false })
    localStorage.removeItem(STORAGE_KEY)
  },

  setFullscreen(value) {
    set({ isFullscreen: value })
  },

  toggleFullscreen() {
    set({ isFullscreen: !get().isFullscreen })
  },
}))
