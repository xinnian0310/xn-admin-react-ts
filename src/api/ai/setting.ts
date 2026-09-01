import request from '@/utils/request'
import type { ApiResponse } from '@/types'
import type { PublicAiSettings } from '@/types/ai/quota'

export function getAiSettings() {
  return request.get<any, ApiResponse<PublicAiSettings>>('/ai/settings')
}
