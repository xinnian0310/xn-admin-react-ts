import request from '@/utils/request'
import type { ApiResponse, SysRoute, SysRouteForm } from '@/types'

export type RouteListParams = {
  page?: number
  size?: number
  FuzzyWord?: string
  keyword?: string
  type?: string
  status?: number | string
  builtIn?: boolean | string
  [key: string]: unknown
}

export type RouteCodegenRequest = {
  modulePrefix: string
  apiBasePath: string
  persistPermissions?: boolean
  generatePageUi?: boolean
}

export type RouteCodegenFile = {
  path: string
  content: string
}

export type RouteCodegenResult = {
  routeId: number
  routePath: string
  viewPath: string
  modulePrefix: string
  apiBasePath: string
  template: string
  permissionCodes: string[]
  persistedPermissionCount: number
  pageUiPersisted: boolean
  sql: string
  files: RouteCodegenFile[]
  zipBase64: string
}

/** 路由树（列表，支持筛选） */
export function list(params?: RouteListParams) {
  return request.get<any, ApiResponse<SysRoute[]>>('/routes/tree', { params })
}

/** 路由详情 */
export function get(id: number) {
  return request.get<any, ApiResponse<SysRoute>>(`/routes/${id}`)
}

/** 新增路由 */
export function create(data: SysRouteForm) {
  return request.post<any, ApiResponse<SysRoute>>('/routes', data)
}

/** 更新路由 */
export function update(id: number, data: SysRouteForm) {
  return request.put<any, ApiResponse<SysRoute>>(`/routes/${id}`, data)
}

/** 删除路由 */
export function remove(id: number) {
  return request.delete<any, ApiResponse<void>>(`/routes/${id}`)
}

/** 批量删除路由 */
export function batchRemove(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/routes/batch-delete', { ids })
}

/** 代码生成：权限落库 + 代码/SQL 预览包 */
export function generate(id: number, data: RouteCodegenRequest) {
  return request.post<any, ApiResponse<RouteCodegenResult>>(`/routes/${id}/generate`, data)
}
