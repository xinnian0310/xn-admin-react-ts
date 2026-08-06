import request from '@/utils/request'
import type {
  ApiResponse,
  FileBrowseResult,
  FileInfo,
  FileTreeNode,
  Job,
  JobForm,
  PageResult,
} from '@/types'

export type JobListParams = {
  page: number
  size: number
  keyword?: string
  status?: number | string
}

export function listFiles(keyword?: string) {
  return request.get<any, ApiResponse<FileInfo[]>>('/files', { params: { keyword } })
}

export function browseFiles(prefix?: string, keyword?: string) {
  return request.get<any, ApiResponse<FileBrowseResult>>('/files/browse', {
    params: { prefix: prefix || '', keyword },
  })
}

export function fetchFileTree() {
  return request.get<any, ApiResponse<FileTreeNode>>('/files/tree')
}

export function uploadFile(file: File, prefix?: string) {
  const form = new FormData()
  form.append('file', file)
  if (prefix) form.append('prefix', prefix)
  return request.post<any, ApiResponse<FileInfo>>('/files/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function createFileDir(path: string) {
  return request.post<any, ApiResponse<void>>('/files/mkdir', { path })
}

export function removeFile(path: string) {
  return request.delete<any, ApiResponse<void>>('/files', { data: { path } })
}

export function listJobs(params?: JobListParams) {
  return request.get<any, ApiResponse<PageResult<Job>>>('/jobs', { params })
}

export function getJob(id: number) {
  return request.get<any, ApiResponse<Job>>(`/jobs/${id}`)
}

export function createJob(data: JobForm) {
  return request.post<any, ApiResponse<Job>>('/jobs', data)
}

export function updateJob(id: number, data: JobForm) {
  return request.put<any, ApiResponse<Job>>(`/jobs/${id}`, data)
}

export function removeJob(id: number) {
  return request.delete<any, ApiResponse<void>>(`/jobs/${id}`)
}

export function batchRemoveJobs(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/jobs/batch-delete', { ids })
}

export function changeJobStatus(id: number, status: number) {
  return request.put<any, ApiResponse<Job>>(`/jobs/${id}/status`, null, { params: { status } })
}

export function runJob(id: number) {
  return request.post<any, ApiResponse<Job>>(`/jobs/${id}/run`)
}
