/** Excel 导入列定义（前端模板 & 解析共用） */
export interface ExcelImportOption {
  /** 下拉显示的中文 */
  label: string
  /** 提交给后端的实际值（如角色/单位编码） */
  value: string
}

export interface ExcelImportColumn {
  /** 对应导入行字段 key，如 username */
  key: string
  /** 表头中文 */
  title: string
  /** 是否必填（模板表头带 *，前端校验） */
  required?: boolean
  /** 模板示例值（展示用，有 options 时填中文 label） */
  example?: string
  /** 列宽（字符约） */
  width?: number
  /** 下拉选项：模板写中文，解析后映射为 value */
  options?: ExcelImportOption[]
}

export interface ImportResult {
  success: number
  failed: number
  errors?: Array<{ row: number; message: string }>
}

export type ExcelImportSubmit = (rows: Record<string, string>[]) => Promise<ImportResult | void>
