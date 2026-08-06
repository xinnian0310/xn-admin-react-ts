import request from '@/utils/request'
import type { ApiResponse, SysUnit, SysUnitForm } from '@/types'

export type UnitListParams = {
  FuzzyWord?: string
  keyword?: string
  status?: number | string
  [key: string]: unknown
}

/** 单位树（列表） */
export function list(params?: UnitListParams) {
  return request.get<any, ApiResponse<SysUnit[]>>('/units/tree', { params })
}

export function get(id: number) {
  return request.get<any, ApiResponse<SysUnit>>(`/units/${id}`)
}

export function create(data: SysUnitForm) {
  return request.post<any, ApiResponse<SysUnit>>('/units', data)
}

export function update(id: number, data: SysUnitForm) {
  return request.put<any, ApiResponse<SysUnit>>(`/units/${id}`, data)
}

export function remove(id: number) {
  return request.delete<any, ApiResponse<void>>(`/units/${id}`)
}

export function batchRemove(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/units/batch-delete', { ids })
}

export function getOptions() {
  return request.get<any, ApiResponse<SysUnit[]>>('/units/options')
}

export function getTree(params?: UnitListParams) {
  return list(params)
}

export function updateStatus(id: number, status: number) {
  return request.put<any, ApiResponse<void>>(`/units/${id}/status`, { status })
}

export function assignRoles(id: number, roleIds: number[]) {
  return request.put<any, ApiResponse<void>>(`/units/${id}/roles`, { roleIds })
}
