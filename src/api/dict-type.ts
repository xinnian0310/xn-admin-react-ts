import request from '@/utils/request'
import type { ApiResponse, DictType, DictTypeForm, PageResult } from '@/types'

export type DictTypeListParams = {
  page: number
  size: number
  keyword?: string
  status?: number | string
  [key: string]: unknown
}

/** 字典类型分页列表 */
export function list(params?: DictTypeListParams) {
  return request.get<any, ApiResponse<PageResult<DictType>>>('/dict-types', { params })
}

export function get(id: number) {
  return request.get<any, ApiResponse<DictType>>(`/dict-types/${id}`)
}

export function create(data: DictTypeForm) {
  return request.post<any, ApiResponse<DictType>>('/dict-types', data)
}

export function update(id: number, data: DictTypeForm) {
  return request.put<any, ApiResponse<DictType>>(`/dict-types/${id}`, data)
}

export function remove(id: number) {
  return request.delete<any, ApiResponse<void>>(`/dict-types/${id}`)
}

export function batchRemove(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/dict-types/batch-delete', { ids })
}

/** 启用状态的字典类型下拉选项 */
export function getOptions() {
  return request.get<any, ApiResponse<DictType[]>>('/dict-types/options')
}
