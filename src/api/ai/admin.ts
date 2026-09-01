import request from '@/utils/request'
import { downloadWithAuth } from '@/utils/download'
import type { ApiResponse, PageResult } from '@/types'
import type {
  AdminProvider,
  AdminProviderModel,
  AdminSettings,
  AdminQuotaRow,
  AdminQuotaSummary,
  AdminQuotaWrite,
  AdminSensitiveWord,
  AdminTrial,
  ProbeResult,
  ProviderPricing,
} from '@/types/ai/admin'

export interface ProviderForm {
  name: string
  code: string
  baseUrl: string
  docUrl?: string
  keyHint?: string
  icon?: string
  sort?: number
  status?: number
}

export interface ProviderModelForm {
  modelId: string
  displayName: string
  contextTokens: number
  defaultMaxOutput?: number
  defaultBudgetTokens?: number | null
  sort?: number
  status?: number
  pricing?: ProviderPricing
}

export function adminListProviders() {
  return request.get<any, ApiResponse<AdminProvider[]>>('/ai/admin/providers')
}

export function adminPageProviders(params: {
  page?: number
  size?: number
  name?: string
  code?: string
  status?: number
}) {
  return request.get<any, ApiResponse<PageResult<AdminProvider>>>('/ai/admin/providers/page', {
    params,
  })
}

export function adminCreateProvider(data: ProviderForm) {
  return request.post<any, ApiResponse<AdminProvider>>('/ai/admin/providers', data)
}

export function adminUpdateProvider(id: string, data: ProviderForm) {
  return request.put<any, ApiResponse<AdminProvider>>(`/ai/admin/providers/${id}`, data)
}

export function adminDisableProvider(id: string) {
  return request.delete<any, ApiResponse<void>>(`/ai/admin/providers/${id}`)
}

export function adminDeleteProvider(id: string) {
  return request.post<any, ApiResponse<void>>(`/ai/admin/providers/${id}/remove`)
}

export function adminCreateProviderModel(providerId: string, data: ProviderModelForm) {
  return request.post<any, ApiResponse<AdminProviderModel>>(
    `/ai/admin/providers/${providerId}/models`,
    data,
  )
}

export function adminUpdateProviderModel(providerId: string, id: string, data: ProviderModelForm) {
  return request.put<any, ApiResponse<AdminProviderModel>>(
    `/ai/admin/providers/${providerId}/models/${id}`,
    data,
  )
}

export function adminDisableProviderModel(providerId: string, id: string) {
  return request.delete<any, ApiResponse<void>>(`/ai/admin/providers/${providerId}/models/${id}`)
}

export function adminTestProviderModel(id: string, apiKey?: string) {
  return request.post<any, ApiResponse<ProbeResult>>(
    `/ai/admin/providers/models/${id}/test`,
    apiKey ? { apiKey } : {},
    { timeout: 20000 },
  )
}

export function adminGetTrial() {
  return request.get<any, ApiResponse<AdminTrial>>('/ai/admin/trial')
}

export function adminUpdateTrial(data: Record<string, unknown>) {
  return request.put<any, ApiResponse<AdminTrial>>('/ai/admin/trial', data)
}

export function adminTestTrial() {
  return request.post<any, ApiResponse<ProbeResult>>('/ai/admin/trial/test', undefined, {
    timeout: 20000,
  })
}

export function adminGetQuotaSummary(month?: string) {
  return request.get<any, ApiResponse<AdminQuotaSummary>>('/ai/admin/quota/summary', {
    params: month ? { month } : undefined,
  })
}

export function adminListSensitiveWords() {
  return request.get<any, ApiResponse<AdminSensitiveWord[]>>('/ai/admin/sensitive-words')
}

export function adminCreateSensitiveWord(data: Partial<AdminSensitiveWord>) {
  return request.post<any, ApiResponse<AdminSensitiveWord>>('/ai/admin/sensitive-words', data)
}

export function adminUpdateSensitiveWord(id: string, data: Partial<AdminSensitiveWord>) {
  return request.put<any, ApiResponse<AdminSensitiveWord>>(`/ai/admin/sensitive-words/${id}`, data)
}

export function adminDeleteSensitiveWord(id: string) {
  return request.delete<any, ApiResponse<void>>(`/ai/admin/sensitive-words/${id}`)
}

export function adminListQuota(params?: {
  page?: number
  size?: number
  keyword?: string
  onlyOverride?: boolean
}) {
  return request.get<any, ApiResponse<PageResult<AdminQuotaRow>>>('/ai/admin/quota', { params })
}

export function adminUpdateQuota(userId: string, data: AdminQuotaWrite) {
  return request.put<any, ApiResponse<AdminQuotaRow>>(`/ai/admin/quota/${userId}`, data)
}

export function adminDeleteQuotaOverride(userId: string) {
  return request.delete<any, ApiResponse<void>>(`/ai/admin/quota/${userId}`)
}

export function adminResetQuota(userId: string) {
  return request.post<any, ApiResponse<void>>(`/ai/admin/quota/${userId}/reset`)
}

export function adminExportUsage(month?: string) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : ''
  return downloadWithAuth(
    `/api/ai/admin/usage/export${qs}`,
    `ai-usage${month ? '-' + month : ''}.csv`,
  )
}

export function adminGetSettings() {
  return request.get<any, ApiResponse<AdminSettings>>('/ai/admin/settings')
}

export function adminUpdateSettings(data: Partial<AdminSettings>) {
  return request.put<any, ApiResponse<AdminSettings>>('/ai/admin/settings', data)
}
