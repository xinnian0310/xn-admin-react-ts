import { usePermissionStore } from '@/stores/permission'

export function usePermission() {
  const hasPermission = usePermissionStore((s) => s.hasPermission)
  const hasAnyPermission = usePermissionStore((s) => s.hasAnyPermission)
  const isSuperAdmin = usePermissionStore((s) => s.isSuperAdmin)
  return { hasPermission, hasAnyPermission, isSuperAdmin }
}
