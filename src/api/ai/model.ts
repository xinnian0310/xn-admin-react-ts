import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types'
import type { ProbeResult } from '@/types/ai/admin'
import type {
  ModelForm,
  ModelListData,
  ProviderCatalog,
  ProviderKeyCheck,
  RemoteModelList,
} from '@/types/ai/model'

export function listModels() {
  return request.get<any, ApiResponse<ModelListData>>('/ai/models')
}

export function listProviders() {
  return request.get<any, ApiResponse<ProviderCatalog[]>>('/ai/providers')
}

export function pageProviders(params: {
  page?: number
  size?: number
  name?: string
  code?: string
}) {
  return request.get<any, ApiResponse<PageResult<ProviderCatalog>>>('/ai/providers/page', {
    params,
  })
}

export function createModel(data: ModelForm) {
  return request.post<any, ApiResponse<unknown>>('/ai/models', data)
}

export function updateModel(id: string, data: ModelForm) {
  return request.put<any, ApiResponse<unknown>>(`/ai/models/${id}`, data)
}

export function deleteModel(id: string) {
  return request.delete<any, ApiResponse<void>>(`/ai/models/${id}`)
}

export function testModel(id: string, silent = false) {
  return request.post<any, ApiResponse<ProbeResult>>(`/ai/models/${id}/test`, undefined, {
    timeout: 20000,
    silentError: silent,
  })
}

export function saveProviderCredential(providerId: string, apiKey: string) {
  return request.put<
    any,
    ApiResponse<{
      keyMask?: string
      keyConfigured?: boolean
      lastCheckOk?: boolean | null
      lastCheckAt?: string | null
    }>
  >(`/ai/providers/${providerId}/credential`, {
    apiKey,
  })
}

export function updateModelStatus(id: string, status: number) {
  return request.put<any, ApiResponse<unknown>>(`/ai/models/${id}/status`, { status })
}

export function listRemoteModels(providerId: string) {
  return request.get<any, ApiResponse<RemoteModelList>>(
    `/ai/providers/${providerId}/remote-models`,
    { timeout: 20000 },
  )
}

/** 用已有的拉取模型接口探测密钥，避免依赖尚未重启的新接口 */
export async function probeProviderCredentials(ids: string[]): Promise<ProviderKeyCheck[]> {
  const checks = await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await listRemoteModels(id)
        return {
          id,
          keyConfigured: true,
          keyMask: res.data?.keyMask,
          lastCheckOk: res.data?.lastCheckOk ?? true,
          lastCheckAt: res.data?.lastCheckAt ?? null,
        } satisfies ProviderKeyCheck
      } catch {
        return {
          id,
          keyConfigured: true,
          lastCheckOk: false,
        } satisfies ProviderKeyCheck
      }
    }),
  )
  return checks
}
