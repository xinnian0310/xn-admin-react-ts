import request from '@/utils/request'
import type { ApiResponse, MenuPermissionGroup, Permission, PermissionForm } from '@/types'

/** 权限树（列表） */
export function list() {
  return request.get<any, ApiResponse<Permission[]>>('/permissions/tree')
}

function findInTree(nodes: Permission[], id: number): Permission | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children?.length) {
      const found = findInTree(node.children, id)
      if (found) return found
    }
  }
  return undefined
}

/**
 * 权限详情（后端无独立详情接口，从树中查找以符合统一 CRUD 约定）
 */
export async function get(id: number) {
  const res = await list()
  const found = findInTree(res.data, id)
  if (!found) {
    return Promise.reject(new Error(`权限不存在: ${id}`))
  }
  return { ...res, data: found } as ApiResponse<Permission>
}

/** 新增权限 */
export function create(data: PermissionForm) {
  return request.post<any, ApiResponse<Permission>>('/permissions', data)
}

/** 更新权限 */
export function update(id: number, data: PermissionForm) {
  return request.put<any, ApiResponse<Permission>>(`/permissions/${id}`, data)
}

/** 删除权限 */
export function remove(id: number) {
  return request.delete<any, ApiResponse<void>>(`/permissions/${id}`)
}

/** 菜单下权限分组（扩展） */
export function getMenuGroups(menuId: number) {
  return request.get<any, ApiResponse<MenuPermissionGroup>>(`/permissions/${menuId}/groups`)
}
