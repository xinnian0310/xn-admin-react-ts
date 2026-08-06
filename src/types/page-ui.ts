import type { SearchItemType } from './search'

export interface PageUiOption {
  label: string
  value: string | number | boolean | null
}

export interface PageUiSearchItem {
  label: string
  prop: string
  type: SearchItemType
  placeholder?: string
  permission?: string
  width?: string | number
  clearable?: boolean
  multiple?: boolean
  options?: PageUiOption[]
}

export interface PageUiButtonDropdown {
  name: string
  action?: string
  icon?: string
  permission?: string
}

export interface PageUiButtonItem {
  name: string
  action?: string
  type?: 'button' | 'down'
  icon?: string
  typeColor?: string
  permission?: string
  index?: number
  disabled?: boolean
  searchItem?: PageUiButtonDropdown[]
}

export interface PageUiConfig {
  routePath: string
  searchItems: PageUiSearchItem[]
  /** 工具栏按钮，来自权限内容 BUTTON 子权限 */
  buttons: PageUiButtonItem[]
  /** 表格操作列按钮，来自权限内容 TABLE_BUTTON 子权限 */
  tableButtons: PageUiButtonItem[]
}
