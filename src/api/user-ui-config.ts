import request from '@/utils/request'
import type { ApiResponse } from '@/types'
import type { LayoutMode } from '@/config/app'

/** 用户个人布局与字号（覆盖全局系统配置对应字段） */
export type UserUiConfig = {
  layout?: { mode?: LayoutMode }
  fontSize?: {
    sidebar?: string
    header?: string
    tagsView?: string
    main?: string
  }
  tagsView?: { height?: string }
  dialog?: { maxHeight?: string }
}

export function getUserUiConfig() {
  return request.get<any, ApiResponse<UserUiConfig | null>>('/user-ui-config')
}

export function saveUserUiConfig(data: UserUiConfig) {
  return request.put<any, ApiResponse<UserUiConfig>>('/user-ui-config', data)
}

export function resetUserUiConfig() {
  return request.delete<any, ApiResponse<null>>('/user-ui-config')
}
