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

export function collectOpenMenuIds(
  items: MenuItem[],
  path: string,
  openIds: string[] = [],
): string[] | null {
  for (const item of items) {
    if (item.path === path) {
      // 可跳转的父级菜单：打开自身，便于看到子项
      return item.children?.length ? [...openIds, item.id] : openIds
    }
    if (item.children) {
      const found = collectOpenMenuIds(item.children, path, [...openIds, item.id])
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
