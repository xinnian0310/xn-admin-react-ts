import type { ApiResponse } from '@/types'

/**
 * 业务 API 模块统一 CRUD 约定（@/api/*.ts 必须按此导出）
 *
 * - list   列表 / 树
 * - get    详情
 * - create 新增
 * - update 更新
 * - remove 删除
 * - batchRemove 批量删除（可选）
 *
 * 模块专有接口可额外导出（如 updateStatus、assignPermissions）
 */
export interface CrudApi<T = unknown, F = unknown, ListParams = unknown, ListResult = T[]> {
  list: (params?: ListParams) => Promise<ApiResponse<ListResult>>
  get: (id: number) => Promise<ApiResponse<T>>
  create: (data: F) => Promise<ApiResponse<T>>
  update: (id: number, data: F) => Promise<ApiResponse<T>>
  remove: (id: number) => Promise<ApiResponse<unknown>>
  batchRemove?: (ids: number[]) => Promise<ApiResponse<{ count: number } | unknown>>
}

export type CrudApiModule = CrudApi & Record<string, unknown>

/** Save 弹窗需 expose 的方法 */
export interface CrudSaveExpose {
  open: (
    mode: 'add' | 'edit' | 'view',
    id?: number,
    options?: import('@/types/save').SaveOpenOptions,
  ) => void | Promise<void>
}
