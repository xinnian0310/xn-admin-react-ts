export type ButtonColorType = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'

export interface ButtonDropdownItem {
  name: string
  icon?: string
  permission?: string
  action?: string
}

export interface ButtonListItem {
  name: string
  type: 'button' | 'down'
  icon?: string
  typeColor?: ButtonColorType
  permission?: string
  /** 前端动作标识，如 add / edit / view / delete */
  action?: string
  /** 需要选中的行数减一：index 为 0 表示必须恰好选中 1 条；未配置时 delete/publish/revoke 默认至少 1 条 */
  index?: number
  disabled?: boolean
  searchItem?: ButtonDropdownItem[]
}
