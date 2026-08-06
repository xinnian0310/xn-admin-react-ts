import request from '@/utils/request'
import type { ApiResponse } from '@/types'

export interface SecurityPolicy {
  maxFailures: number
  lockMinutes: number
  rateLimitPerMinute: number
  captchaTtlSeconds: number
  pwdMinLength: number
  pwdMaxLength: number
  pwdRequireUpper: boolean
  pwdRequireLower: boolean
  pwdRequireDigit: boolean
  pwdRequireSpecial: boolean
  pwdExpireDays: number
  pwdForceChangeFirst: boolean
  pwdHistoryCount: number
  updatedAt?: string | null
}

export interface LockedAccount {
  username: string
  remainSeconds: number
}

export function getSecurityPolicy() {
  return request.get<any, ApiResponse<SecurityPolicy>>('/security-policy')
}

export function updateSecurityPolicy(data: SecurityPolicy) {
  return request.put<any, ApiResponse<SecurityPolicy>>('/security-policy', data)
}

export function listLockedAccounts() {
  return request.get<any, ApiResponse<LockedAccount[]>>('/security-policy/locks')
}

export function unlockAccount(username: string) {
  return request.delete<any, ApiResponse<null>>(
    `/security-policy/locks/${encodeURIComponent(username)}`,
  )
}
