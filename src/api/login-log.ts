import request from '@/utils/request'
import { buildQueryString, downloadWithAuth } from '@/utils/download'
import type { ApiResponse, LoginLog, PageResult } from '@/types'

export type LoginLogListParams = {
  page: number
  size: number
  keyword?: string
  status?: number | string
  beginTime?: string
  endTime?: string
  [key: string]: unknown
}

export function list(params?: LoginLogListParams) {
  return request.get<any, ApiResponse<PageResult<LoginLog>>>('/logs/login', { params })
}

export function remove(id: number) {
  return request.delete<any, ApiResponse<void>>(`/logs/login/${id}`)
}

export function batchRemove(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/logs/login/batch-delete', { ids })
}

export function clean() {
  return request.delete<any, ApiResponse<void>>('/logs/login/clean')
}

export function exportLoginLogs(params?: Omit<LoginLogListParams, 'page' | 'size'>) {
  const qs = buildQueryString({ ...(params || {}) })
  return downloadWithAuth(`/api/logs/login/export${qs}`, 'login-logs.xlsx')
}
