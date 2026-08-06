import type { MenuItem } from '@/types/menu'

export function filterMenusByPermission(items: MenuItem[], permissions: string[]): MenuItem[] {
  const permSet = new Set(permissions)
  return items
    .map((item) => {
      if (item.hidden) return null
      const children = item.children
        ? filterMenusByPermission(item.children, permissions)
        : undefined
      const hasPermission = !item.permission || permSet.has(item.permission)
      const hasVisibleChild = children && children.length > 0
      if (!hasPermission && !hasVisibleChild) return null
      if (item.path && !hasPermission) return null
      return {
        ...item,
        children: hasVisibleChild ? children : undefined,
      } as MenuItem
    })
    .filter((item): item is MenuItem => item !== null)
}
