import { create } from 'zustand'

const SUPER_ADMIN = 'SUPER_ADMIN'

interface PermissionState {
  roles: string[]
  permissions: string[]
  setAuthData: (roleList: string[], permissionList: string[]) => void
  clear: () => void
  isSuperAdmin: () => boolean
  hasPermission: (code: string) => boolean
  hasAnyPermission: (codes: string[]) => boolean
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  roles: [],
  permissions: [],

  setAuthData(roleList, permissionList) {
    set({ roles: roleList, permissions: permissionList })
  },

  clear() {
    set({ roles: [], permissions: [] })
  },

  isSuperAdmin() {
    return get().roles.includes(SUPER_ADMIN)
  },

  hasPermission(code) {
    if (get().isSuperAdmin()) return true
    return get().permissions.includes(code)
  },

  hasAnyPermission(codes) {
    return codes.some((code) => get().hasPermission(code))
  },
}))
