import axios from 'axios'
import request, { formatRequestError } from '@/utils/request'
import type { ApiResponse } from '@/types'
import type { AppConfig } from '@/config/app'
import { APP_CLIENT_ID } from '@/config/client'

/** 后端系统配置（不含 theme 色）；clients 仅管理端读写，不进本地 app 配置 */
export type ClientAppProfile = { name?: string; intro?: string }

export type SystemConfigPayload = {
  app: AppConfig['app'] & {
    clients?: Record<string, ClientAppProfile>
  }
  session: AppConfig['session']
  ui: {
    dialog: AppConfig['ui']['dialog']
    layout: { mode: AppConfig['ui']['layout']['mode'] }
    fontSize: AppConfig['ui']['fontSize']
    tagsView: AppConfig['ui']['tagsView']
    elementPlus: AppConfig['ui']['elementPlus']
  }
  storage: AppConfig['storage']
  logRetention: AppConfig['logRetention']
  sensitiveData: AppConfig['sensitiveData']
}

/** 公开配置（登录前，无需鉴权）；按本工程 clientId 取品牌文案 */
export function getPublicConfig() {
  return axios
    .get<ApiResponse<SystemConfigPayload>>('/api/system-config/public', {
      timeout: 10000,
      params: { client: APP_CLIENT_ID },
    })
    .then((res) => {
      const data = res.data
      if (data.code !== 200) {
        return Promise.reject(new Error(data.message || '获取系统配置失败'))
      }
      return data
    })
    .catch((error) => {
      return Promise.reject(new Error(formatRequestError(error, '获取系统配置失败')))
    })
}

export function getSystemConfig() {
  return request.get<any, ApiResponse<SystemConfigPayload>>('/system-config')
}

export function updateSystemConfig(data: SystemConfigPayload) {
  return request.put<any, ApiResponse<SystemConfigPayload>>('/system-config', data)
}

export function uploadBrandAsset(file: File) {
  const form = new FormData()
  form.append('file', file)
  return request.post<any, ApiResponse<{ url: string }>>('/system-config/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
