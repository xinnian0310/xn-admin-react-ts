import request from '@/utils/request'
import type { ApiResponse, MyNotice, Notice, NoticeForm, NoticeReader, PageResult } from '@/types'

export type NoticeListParams = {
  page: number
  size: number
  keyword?: string
  status?: string
}

export function list(params?: NoticeListParams) {
  return request.get<any, ApiResponse<PageResult<Notice>>>('/notices', { params })
}

export function get(id: number) {
  return request.get<any, ApiResponse<Notice>>(`/notices/${id}`)
}

export function create(data: NoticeForm) {
  return request.post<any, ApiResponse<Notice>>('/notices', data)
}

export function update(id: number, data: NoticeForm) {
  return request.put<any, ApiResponse<Notice>>(`/notices/${id}`, data)
}

export function remove(id: number) {
  return request.delete<any, ApiResponse<null>>(`/notices/${id}`)
}

export function batchRemove(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/notices/batch-delete', { ids })
}

export function publish(id: number) {
  return request.post<any, ApiResponse<Notice>>(`/notices/${id}/publish`)
}

export function batchPublish(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/notices/batch-publish', { ids })
}

export function revoke(id: number) {
  return request.post<any, ApiResponse<Notice>>(`/notices/${id}/revoke`)
}

export function batchRevoke(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/notices/batch-revoke', { ids })
}

export function readers(id: number) {
  return request.get<any, ApiResponse<NoticeReader[]>>(`/notices/${id}/readers`)
}

export function listMine() {
  return request.get<any, ApiResponse<MyNotice[]>>('/notices/mine')
}

export function markRead(id: number) {
  return request.post<any, ApiResponse<null>>(`/notices/${id}/read`)
}
