import request from '@/utils/request'
import { buildQueryString, downloadWithAuth } from '@/utils/download'
import type { ApiResponse, PageResult } from '@/types'
import type { JobLog } from '@/types/job-log'

export type JobLogListParams = {
  page: number
  size: number
  keyword?: string
  jobId?: number
  status?: string
  beginTime?: string
  endTime?: string
}

export function listJobLogs(params?: JobLogListParams) {
  return request.get<any, ApiResponse<PageResult<JobLog>>>('/logs/job', { params })
}

export function getJobLog(id: number) {
  return request.get<any, ApiResponse<JobLog>>(`/logs/job/${id}`)
}

export function removeJobLog(id: number) {
  return request.delete<any, ApiResponse<void>>(`/logs/job/${id}`)
}

export function batchRemoveJobLogs(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/logs/job/batch-delete', { ids })
}

export function cleanJobLogs() {
  return request.delete<any, ApiResponse<void>>('/logs/job/clean')
}

export function exportJobLogs(params?: Omit<JobLogListParams, 'page' | 'size'>) {
  const qs = buildQueryString({ ...(params || {}) })
  return downloadWithAuth(`/api/logs/job/export${qs}`, 'job-logs.xlsx')
}
