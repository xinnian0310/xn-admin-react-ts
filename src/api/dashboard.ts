import request from '@/utils/request'
import type { ApiResponse, DashboardStats } from '@/types'

export function getDashboardStats() {
  return request.get<any, ApiResponse<DashboardStats>>('/dashboard/stats')
}
