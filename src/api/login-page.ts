import axios from 'axios'
import request, { formatRequestError } from '@/utils/request'
import type { ApiResponse, LoginPageConfig, LoginPageConfigForm, PageResult } from '@/types'

export type LoginPageConfigListParams = {
  page: number
  size: number
  keyword?: string
  status?: number | string
  [key: string]: unknown
}

/** 当前启用的登录页配置（无需登录） */
export function getActive() {
  // 使用独立 axios，避免登录前接口守卫 / 401 跳转干扰
  return axios
    .get<ApiResponse<LoginPageConfig | null>>('/api/login-page-configs/active', {
      timeout: 10000,
    })
    .then((res) => {
      const data = res.data
      if (data.code !== 200) {
        return Promise.reject(new Error(data.message || '获取登录页配置失败'))
      }
      return data
    })
    .catch((error) => {
      return Promise.reject(new Error(formatRequestError(error, '获取登录页配置失败')))
    })
}

export function list(params?: LoginPageConfigListParams) {
  return request.get<any, ApiResponse<PageResult<LoginPageConfig>>>('/login-page-configs', {
    params,
  })
}

export function get(id: number) {
  return request.get<any, ApiResponse<LoginPageConfig>>(`/login-page-configs/${id}`)
}

export function create(data: LoginPageConfigForm) {
  return request.post<any, ApiResponse<LoginPageConfig>>('/login-page-configs', data)
}

export function update(id: number, data: LoginPageConfigForm) {
  return request.put<any, ApiResponse<LoginPageConfig>>(`/login-page-configs/${id}`, data)
}

export function updateStatus(id: number, status: number) {
  return request.put<any, ApiResponse<void>>(`/login-page-configs/${id}/status`, { status })
}

export function remove(id: number) {
  return request.delete<any, ApiResponse<void>>(`/login-page-configs/${id}`)
}

export function batchRemove(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/login-page-configs/batch-delete', {
    ids,
  })
}
