export interface DictType {
  id: number
  name: string
  type: string
  status: number
  remark?: string
  builtIn: boolean
  createdAt: string
  updatedAt: string
}

export interface DictTypeForm {
  name: string
  type: string
  status: number
  remark?: string
}

export interface DictData {
  id: number
  dictType: string
  label: string
  value: string
  sort: number
  status: number
  isDefault: boolean
  listClass?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface DictDataForm {
  dictType: string
  label: string
  value: string
  sort: number
  status: number
  isDefault: boolean
  listClass?: string
  remark?: string
}

/** el-tag 可选样式，供字典数据「标签样式」选择使用 */
export const DICT_LIST_CLASS_OPTIONS = [
  { label: '默认', value: '' },
  { label: '主要', value: 'primary' },
  { label: '成功', value: 'success' },
  { label: '警告', value: 'warning' },
  { label: '危险', value: 'danger' },
  { label: '信息', value: 'info' },
]
