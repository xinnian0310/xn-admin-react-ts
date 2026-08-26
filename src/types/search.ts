export type SearchItemType =
  'input' | 'number' | 'select' | 'date' | 'daterange' | 'datetime' | 'dict' | 'region'

export interface SearchItemOption {
  label: string
  value: string | number | boolean | null
}

export interface SearchItem {
  label: string
  prop: string
  type: SearchItemType
  placeholder?: string
  options?: SearchItemOption[]
  /** type=dict 时的字典类型；传入 options 则不请求 */
  dictType?: string
  /** type=region：2=省市，3=省市区 */
  level?: 2 | 3
  width?: string | number
  clearable?: boolean
  multiple?: boolean
}

export type SearchForm = Record<string, unknown>

/** 搜索项控件默认宽度（px） */
export const SEARCH_FIELD_DEFAULT_WIDTH = 200
