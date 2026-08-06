import request from '@/utils/request'
import type { ApiResponse } from '@/types'

export type TableInfo = {
  tableName: string
  remarks?: string
}

export type ColumnMeta = {
  columnName: string
  remarks?: string
  label: string
  jdbcType?: string
  javaType: string
  javaField: string
  formType: string
  pk: boolean
  nullable: boolean
  columnSize?: number
  listShow: boolean
  queryable: boolean
  formShow: boolean
  required: boolean
}

export type TableCodegenColumnRequest = {
  columnName: string
  label?: string
  javaType?: string
  javaField?: string
  formType?: string
  pk: boolean
  nullable: boolean
  columnSize?: number
  listShow: boolean
  queryable: boolean
  formShow: boolean
  required: boolean
}

export type TableCodegenRequest = {
  tableName: string
  modulePrefix: string
  className?: string
  apiBasePath: string
  menuTitle: string
  menuPath: string
  viewPath: string
  persistPermissions?: boolean
  generatePageUi?: boolean
  createMenu?: boolean
  columns: TableCodegenColumnRequest[]
}

export type TableCodegenFile = {
  path: string
  content: string
}

export type TableCodegenResult = {
  tableName: string
  modulePrefix: string
  className: string
  apiBasePath: string
  menuPath: string
  viewPath: string
  permissionCodes: string[]
  persistedPermissionCount: number
  pageUiPersisted: boolean
  menuCreated: boolean
  sql: string
  files: TableCodegenFile[]
  zipBase64: string
}

export function listTables(includeSys = false) {
  return request.get<any, ApiResponse<TableInfo[]>>('/codegen/tables', {
    params: { includeSys },
  })
}

export function listColumns(tableName: string) {
  return request.get<any, ApiResponse<ColumnMeta[]>>(
    `/codegen/tables/${encodeURIComponent(tableName)}/columns`,
  )
}

export function generate(data: TableCodegenRequest) {
  return request.post<any, ApiResponse<TableCodegenResult>>('/codegen/generate', data)
}
