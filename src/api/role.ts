import request from '@/utils/request'
import type { ApiResponse, Role, RoleDetail, RoleForm, PageResult } from '@/types'

export type RoleListParams = { page: number; size: number; keyword?: string }

/** 角色分页列表 */
export function list(params?: RoleListParams) {
  return request.get<any, ApiResponse<PageResult<Role>>>('/roles', { params })
}

/** 角色详情 */
export function get(id: number) {
  return request.get<any, ApiResponse<RoleDetail>>(`/roles/${id}`)
}

/** 新增角色 */
export function create(data: RoleForm) {
  return request.post<any, ApiResponse<Role>>('/roles', data)
}

/** 更新角色 */
export function update(id: number, data: RoleForm) {
  return request.put<any, ApiResponse<Role>>(`/roles/${id}`, data)
}

/** 删除角色 */
export function remove(id: number) {
  return request.delete<any, ApiResponse<void>>(`/roles/${id}`)
}

/** 批量删除角色 */
export function batchRemove(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/roles/batch-delete', { ids })
}

/** 角色下拉选项（扩展） */
export function getOptions() {
  return request.get<any, ApiResponse<Role[]>>('/roles/options')
}

/** 更新角色状态（扩展） */
export function updateStatus(id: number, status: number) {
  return request.put<any, ApiResponse<void>>(`/roles/${id}/status`, { status })
}

/** 分配权限（扩展） */
export function assignPermissions(id: number, permissionIds: number[]) {
  return request.put<any, ApiResponse<void>>(`/roles/${id}/permissions`, { permissionIds })
}
