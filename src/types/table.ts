/** 列渲染类型 */
export type TableColumnType =
  'selection' | 'index' | 'text' | 'datetime' | 'tag' | 'switch' | 'iconText' | 'longText' | 'slot'

export type TableColumnAlign = 'left' | 'center' | 'right'
export type TableColumnFixed = boolean | 'left' | 'right'
export type TableTagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

/** tag / 字典映射项 */
export interface TableColumnOption {
  value: string | number | boolean | null
  label: string
  /** el-tag 的 type，仅 type=tag 时生效 */
  type?: TableTagType
}

/**
 * 表格列配置（页面侧用 JSON/对象数组声明即可）
 *
 * 常用：prop、label、align、width / minWidth
 * 扩展：type、fixed、options、prefix/suffix、slot、showOverflowTooltip 等
 */
export interface TableColumnItem {
  /** 字段名；selection / index / 纯 slot 可不填 */
  prop?: string
  /** 列标题（中文名） */
  label?: string
  /** 对齐方式 */
  align?: TableColumnAlign
  /** 固定宽度 */
  width?: string | number
  /** 最小宽度（自适应列优先用这个） */
  minWidth?: string | number
  /** 列渲染类型，默认 text；datetime 用 dayjs 格式化为 YYYY-MM-DD HH:mm:ss */
  type?: TableColumnType
  /** 固定列 */
  fixed?: TableColumnFixed
  /** 过长省略并 tooltip（longText 列请用点击弹窗，勿再开此项） */
  showOverflowTooltip?: boolean
  /** type=longText 时触发区最大字符数，默认 48 */
  longTextMaxLength?: number
  /** 空值占位，默认 — */
  emptyText?: string
  /** 文本前缀，如 views/ */
  prefix?: string
  /** 文本后缀，如 / */
  suffix?: string
  /**
   * 字典 / tag 映射（type=tag 或需要文案映射时）
   * value 会按 String(实际值) 匹配
   */
  options?: TableColumnOption[]
  /** type=iconText 时图标字段名，默认 icon */
  iconProp?: string
  /** type=iconText 时图标尺寸 */
  iconSize?: number
  /** type=tag 时标签尺寸 */
  tagSize?: 'large' | 'default' | 'small'
  /** type=switch 时：开启对应的值，默认 1 */
  activeValue?: string | number | boolean
  /** type=switch 时：关闭对应的值，默认 0 */
  inactiveValue?: string | number | boolean
  /** type=switch 时：禁用字段名（取 row 上该字段为 true 则禁用） */
  disabledProp?: string
  /** type=slot 时具名插槽名；不填则用 prop */
  slot?: string
  /** type=index 时起始序号，默认 1 */
  index?: number
  /** 是否可排序 */
  sortable?: boolean | 'custom'
  /** 列 className */
  className?: string
  /** 是否显示，默认 true；便于按条件过滤 */
  visible?: boolean
}
