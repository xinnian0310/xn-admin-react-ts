import request from '@/utils/request'
import { buildQueryString, downloadWithAuth } from '@/utils/download'
import type { ApiResponse, PageResult, User, UserForm } from '@/types'
import type { ImportResult } from '@/types/excel'

export type UserListParams = {
  page: number
  size: number
  keyword?: string
  roleId?: number
  unitId?: number
}

export type UserImportRow = {
  username: string
  password?: string
  nickname?: string
  email?: string
  phone?: string
  roleCodes?: string
  unitCode?: string
  postCode?: string
  status?: number | string
}

/** 用户分页列表 */
export function list(params?: UserListParams) {
  return request.get<any, ApiResponse<PageResult<User>>>('/users', { params })
}

/** 用户详情 */
export function get(id: number) {
  return request.get<any, ApiResponse<User>>(`/users/${id}`)
}

/** 新增用户 */
export function create(data: UserForm) {
  return request.post<any, ApiResponse<User>>('/users', data)
}

/** 更新用户 */
export function update(id: number, data: UserForm) {
  return request.put<any, ApiResponse<User>>(`/users/${id}`, data)
}

/** 删除用户 */
export function remove(id: number) {
  return request.delete<any, ApiResponse<null>>(`/users/${id}`)
}

/** 批量删除用户 */
export function batchRemove(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/users/batch-delete', { ids })
}

/** 更新用户状态（扩展） */
export function updateStatus(id: number, status: number) {
  return request.patch<any, ApiResponse<null>>(`/users/${id}/status`, { status })
}

/** Excel 导入用户（前端解析后提交行数据） */
export function importUsers(rows: UserImportRow[]) {
  return request.post<any, ApiResponse<ImportResult>>('/users/import', rows)
}

/** 导出用户 CSV */
export function exportUsers(params?: Omit<UserListParams, 'page' | 'size'>) {
  const qs = buildQueryString({ ...(params || {}) })
  return downloadWithAuth(`/api/users/export${qs}`, 'users.xlsx')
}
