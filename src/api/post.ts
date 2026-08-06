import request from '@/utils/request'
import { buildQueryString, downloadWithAuth } from '@/utils/download'
import type { ApiResponse, PageResult } from '@/types'
import type { ImportResult } from '@/types/excel'
import type { Post, PostForm } from '@/types/post'

export type PostListParams = {
  page: number
  size: number
  keyword?: string
  status?: number | string
}

export type PostImportRow = {
  code: string
  name: string
  sort?: number | string
  status?: number | string
  remark?: string
}

export function list(params?: PostListParams) {
  return request.get<any, ApiResponse<PageResult<Post>>>('/posts', { params })
}

export function get(id: number) {
  return request.get<any, ApiResponse<Post>>(`/posts/${id}`)
}

export function create(data: PostForm) {
  return request.post<any, ApiResponse<Post>>('/posts', data)
}

export function update(id: number, data: PostForm) {
  return request.put<any, ApiResponse<Post>>(`/posts/${id}`, data)
}

export function remove(id: number) {
  return request.delete<any, ApiResponse<void>>(`/posts/${id}`)
}

export function batchRemove(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/posts/batch-delete', { ids })
}

export function updateStatus(id: number, status: number) {
  return request.put<any, ApiResponse<void>>(`/posts/${id}/status`, null, { params: { status } })
}

export function getOptions() {
  return request.get<any, ApiResponse<Post[]>>('/posts/options')
}

export function importPosts(rows: PostImportRow[]) {
  return request.post<any, ApiResponse<ImportResult>>('/posts/import', rows)
}

export function exportPosts(params?: { keyword?: string; status?: number | string }) {
  const qs = buildQueryString({ ...(params || {}) })
  return downloadWithAuth(`/api/posts/export${qs}`, 'posts.xlsx')
}
