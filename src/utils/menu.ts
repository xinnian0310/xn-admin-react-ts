import type { MenuItem } from '@/types/menu'

export function filterHiddenMenus(items: MenuItem[]): MenuItem[] {
  return items
    .filter((item) => !item.hidden)
    .map((item) => ({
      ...item,
      children: item.children ? filterHiddenMenus(item.children) : undefined,
    }))
}

export function findMenuByPath(items: MenuItem[], path: string): MenuItem | undefined {
  for (const item of items) {
    if (item.path === path) return item
    if (item.children) {
      const found = findMenuByPath(item.children, path)
      if (found) return found
    }
  }
  return undefined
}

/** Ant Design Menu 节点 key：有 path 用 path，否则 menu-{id} */
export function menuNodeKey(item: MenuItem): string {
  return item.path || `menu-${item.id}`
}

export function collectOpenMenuIds(
  items: MenuItem[],
  path: string,
  openIds: string[] = [],
): string[] | null {
  for (const item of items) {
    const key = menuNodeKey(item)
    if (item.path === path) {
      // 可跳转的父级菜单：打开自身，便于看到子项
      return item.children?.length ? [...openIds, key] : openIds
    }
    if (item.children) {
      const found = collectOpenMenuIds(item.children, path, [...openIds, key])
      if (found) return found
    }
  }
  return null
}

export function getAffixTags(items: MenuItem[]): MenuItem[] {
  const tags: MenuItem[] = []
  function walk(list: MenuItem[]) {
    for (const item of list) {
      if (item.affix && item.path) tags.push(item)
      if (item.children) walk(item.children)
    }
  }
  walk(items)
  return tags
}

/** 当前路径所属的一级菜单 */
export function findTopLevelMenu(items: MenuItem[], path: string): MenuItem | undefined {
  for (const item of items) {
    if (item.path === path) return item
    if (item.children?.length && collectOpenMenuIds(item.children, path)) {
      return item
    }
  }
  return undefined
}

/** 菜单树中第一个可跳转 path（深度优先） */
export function findFirstNavigablePath(item: MenuItem): string | undefined {
  if (item.path) return item.path
  if (!item.children?.length) return undefined
  for (const child of item.children) {
    const path = findFirstNavigablePath(child)
    if (path) return path
  }
  return undefined
}

/** 模糊匹配菜单标题：包含关键词，或字符顺序匹配（忽略大小写） */
export function fuzzyMatchMenuTitle(title: string, keyword: string): boolean {
  const t = title.toLowerCase()
  const k = keyword.toLowerCase().trim()
  if (!k) return false
  if (t.includes(k)) return true
  let i = 0
  for (const ch of t) {
    if (ch === k[i]) i += 1
    if (i >= k.length) return true
  }
  return false
}

export interface MenuSearchHit {
  id: string
  title: string
  /** 祖先目录 Ant Design openKeys */
  ancestorKeys: string[]
}

/** 在菜单树中模糊检索标题，深度优先，不跳转 */
export function searchMenus(items: MenuItem[], keyword: string): MenuSearchHit[] {
  const hits: MenuSearchHit[] = []
  const k = keyword.trim()
  if (!k) return hits

  function walk(list: MenuItem[], ancestors: string[]) {
    for (const item of list) {
      if (fuzzyMatchMenuTitle(item.title, k)) {
        hits.push({ id: item.id, title: item.title, ancestorKeys: ancestors })
      }
      if (item.children?.length) {
        walk(item.children, [...ancestors, menuNodeKey(item)])
      }
    }
  }
  walk(items, [])
  return hits
}

/** 搜索命中项需展开的祖先 key（去重，保序） */
export function collectSearchOpenKeys(hits: MenuSearchHit[]): string[] {
  const seen = new Set<string>()
  const keys: string[] = []
  for (const hit of hits) {
    for (const key of hit.ancestorKeys) {
      if (seen.has(key)) continue
      seen.add(key)
      keys.push(key)
    }
  }
  return keys
}
