import request from '@/utils/request'
import { buildQueryString, downloadWithAuth } from '@/utils/download'
import type { ApiResponse, OperLog, PageResult } from '@/types'

export type OperLogListParams = {
  page: number
  size: number
  keyword?: string
  businessType?: string
  status?: number | string
  beginTime?: string
  endTime?: string
  [key: string]: unknown
}

export function list(params?: OperLogListParams) {
  return request.get<any, ApiResponse<PageResult<OperLog>>>('/logs/oper', { params })
}

export function get(id: number) {
  return request.get<any, ApiResponse<OperLog>>(`/logs/oper/${id}`)
}

export function remove(id: number) {
  return request.delete<any, ApiResponse<void>>(`/logs/oper/${id}`)
}

export function batchRemove(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/logs/oper/batch-delete', { ids })
}

export function clean() {
  return request.delete<any, ApiResponse<void>>('/logs/oper/clean')
}

export function exportOperLogs(params?: Omit<OperLogListParams, 'page' | 'size'>) {
  const qs = buildQueryString({ ...(params || {}) })
  return downloadWithAuth(`/api/logs/oper/export${qs}`, 'oper-logs.xlsx')
}
