import request from '@/utils/request'
import type { ApiResponse } from '@/types'
import type { MyQuota } from '@/types/ai/quota'

export function getMyQuota() {
  return request.get<any, ApiResponse<MyQuota>>('/ai/quota/me')
}
