import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types'
import type { RecycleBinItem } from '@/types/recycle'

export type RecycleListParams = {
  page: number
  size: number
  keyword?: string
  bizType?: string
}

export function listRecycle(params?: RecycleListParams) {
  return request.get<any, ApiResponse<PageResult<RecycleBinItem>>>('/recycle', { params })
}

export function restoreRecycle(id: number) {
  return request.post<any, ApiResponse<void>>(`/recycle/${id}/restore`)
}

export function purgeRecycle(id: number) {
  return request.delete<any, ApiResponse<void>>(`/recycle/${id}`)
}

export function batchPurgeRecycle(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/recycle/batch-delete', { ids })
}

export function cleanRecycle() {
  return request.delete<any, ApiResponse<void>>('/recycle/clean')
}
