import { useMemo, type CSSProperties } from 'react'
import { Cascader } from 'antd'
import {
  CHINA_REGION,
  filterRegionByLevel,
  findRegionCodesByLabels,
  findRegionLabels,
  formatRegionText,
  parseRegionText,
  type RegionNode,
  type RegionValue,
} from '@/utils/region'

export type RegionValueType = 'codes' | 'labels' | 'text'

export type RegionChangeExtra = {
  value: RegionValue
  labels: string[]
  text: string
}

export type XnRegionProps = {
  value?: RegionValue | string
  onChange?: (value: RegionValue | string, extra?: RegionChangeExtra) => void
  /** 传入后不再使用内置省市区 */
  options?: RegionNode[]
  /** 2=省市，3=省市区（无区县的地市仍为两级） */
  level?: 2 | 3
  /** codes=区划代码；labels=名称数组；text=拼接文案 */
  valueType?: RegionValueType
  separator?: string
  clearable?: boolean
  disabled?: boolean
  filterable?: boolean
  checkStrictly?: boolean
  placeholder?: string
  style?: CSSProperties
  className?: string
}

export default function XnRegion({
  value,
  onChange,
  options,
  level = 3,
  valueType = 'codes',
  separator = ' / ',
  clearable = true,
  disabled = false,
  filterable = true,
  checkStrictly = false,
  placeholder,
  style,
  className,
}: XnRegionProps) {
  const tree = useMemo(
    () => filterRegionByLevel(options?.length ? options : CHINA_REGION, level),
    [options, level],
  )

  const resolvedPlaceholder = placeholder || (level === 2 ? '请选择省 / 市' : '请选择省 / 市 / 区')

  const codes = useMemo<RegionValue>(() => {
    if (valueType === 'text') {
      return parseRegionText(typeof value === 'string' ? value : '', tree, separator)
    }
    const list = Array.isArray(value) ? value : []
    if (valueType === 'labels') return findRegionCodesByLabels(list, tree)
    return list
  }, [value, valueType, tree, separator])

  function emitValue(next: RegionValue, labels: string[], text: string) {
    if (valueType === 'text') onChange?.(text, { value: next, labels, text })
    else if (valueType === 'labels') onChange?.(labels, { value: next, labels, text })
    else onChange?.(next, { value: next, labels, text })
  }

  function handleChange(next: RegionValue | undefined) {
    const resolved = next ?? []
    const labels = findRegionLabels(resolved, tree)
    const text = formatRegionText(resolved, tree, separator)
    emitValue(resolved, labels, text)
  }

  return (
    <Cascader
      className={className}
      style={{ width: '100%', ...style }}
      value={codes.length ? codes : undefined}
      options={tree}
      allowClear={clearable}
      disabled={disabled}
      showSearch={filterable}
      changeOnSelect={checkStrictly}
      expandTrigger="hover"
      placeholder={resolvedPlaceholder}
      onChange={(next) => handleChange(next as RegionValue | undefined)}
    />
  )
}
