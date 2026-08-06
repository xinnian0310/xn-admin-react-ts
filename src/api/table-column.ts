import request from '@/utils/request'
import type { ApiResponse } from '@/types'

export interface TableColumnSetting {
  key: string
  prop?: string
  label?: string
  width?: number | null
  visible?: boolean
  sort?: number
  /** 锁定列（如多选）：不可拖动、列名不可改 */
  locked?: boolean
}

export interface TableColumnConfig {
  tableKey: string
  columns: TableColumnSetting[]
}

export function getTableColumns(tableKey: string) {
  return request.get<any, ApiResponse<TableColumnConfig>>('/table-columns', {
    params: { tableKey },
  })
}

export function saveTableColumns(payload: TableColumnConfig) {
  return request.put<any, ApiResponse<TableColumnConfig>>('/table-columns', payload)
}
