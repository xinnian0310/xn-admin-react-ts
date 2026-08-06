import request from '@/utils/request'
import type {
  ApiResponse,
  InfraStatus,
  OnlineUser,
  RedisMonitor,
  ServerMonitor,
  SqlMonitor,
} from '@/types'

export function getOnlineUsers() {
  return request.get<any, ApiResponse<OnlineUser[]>>('/monitor/online')
}

export function kickUser(userId: number) {
  return request.post<any, ApiResponse<{ count: number }>>(`/monitor/online/${userId}/kick`)
}

export function getServerMonitor() {
  return request.get<any, ApiResponse<ServerMonitor>>('/monitor/server')
}

export function getInfraStatus() {
  return request.get<any, ApiResponse<InfraStatus>>('/monitor/infra')
}

export function restartInfra(name: string) {
  return request.post<any, ApiResponse<{ name: string; projectRoot: string; message: string }>>(
    `/monitor/infra/${name}/restart`,
  )
}

export function getRedisMonitor() {
  return request.get<any, ApiResponse<RedisMonitor>>('/monitor/redis')
}

export function deleteRedisKey(key: string) {
  return request.delete<any, ApiResponse<void>>('/monitor/redis/keys', { params: { key } })
}

export function flushRedis() {
  return request.delete<any, ApiResponse<void>>('/monitor/redis/flush')
}

export function getSqlMonitor() {
  return request.get<any, ApiResponse<SqlMonitor>>('/monitor/sql')
}

export function cleanSqlMonitor() {
  return request.delete<any, ApiResponse<void>>('/monitor/sql/clean')
}

export function removeSqlRecord(id: number) {
  return request.delete<any, ApiResponse<void>>(`/monitor/sql/records/${id}`)
}
