import request from '@/utils/request'
import type { ApiResponse, DictData, DictDataForm, PageResult } from '@/types'

export type DictDataListParams = {
  dictType: string
  page: number
  size: number
  keyword?: string
  status?: number | string
  [key: string]: unknown
}

/** 字典数据分页列表（按字典类型过滤） */
export function list(params: DictDataListParams) {
  return request.get<any, ApiResponse<PageResult<DictData>>>('/dict-data', { params })
}

export function get(id: number) {
  return request.get<any, ApiResponse<DictData>>(`/dict-data/${id}`)
}

export function create(data: DictDataForm) {
  return request.post<any, ApiResponse<DictData>>('/dict-data', data)
}

export function update(id: number, data: DictDataForm) {
  return request.put<any, ApiResponse<DictData>>(`/dict-data/${id}`, data)
}

export function remove(id: number) {
  return request.delete<any, ApiResponse<void>>(`/dict-data/${id}`)
}

export function batchRemove(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/dict-data/batch-delete', { ids })
}

/** 供任意业务页面动态取某字典类型下的启用项（下拉选项/标签渲染） */
export function getByType(dictType: string) {
  return request.get<any, ApiResponse<DictData[]>>(`/dict-data/type/${dictType}`)
}
