export type SearchItemType = 'input' | 'number' | 'select' | 'date' | 'daterange' | 'datetime'

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
  width?: string | number
  clearable?: boolean
  multiple?: boolean
}

export type SearchForm = Record<string, unknown>

/** 搜索项控件默认宽度（px） */
export const SEARCH_FIELD_DEFAULT_WIDTH = 200
