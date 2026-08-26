import { useEffect, useState, type CSSProperties } from 'react'
import { Select } from 'antd'
import { getByType } from '@/api/dict-data'
import type { DictData } from '@/types'

export type DictOption = { label: string; value: string | number }

export type DictSelectValue = string | number | Array<string | number> | null | undefined

export type XnDictSelectProps = {
  value?: DictSelectValue
  onChange?: (value: DictSelectValue) => void
  /** 字典类型；传入 options 时可不传 */
  dictType?: string
  /** 本地选项，传入后不再请求接口（演示 / 离线） */
  options?: DictOption[]
  multiple?: boolean
  allowClear?: boolean
  disabled?: boolean
  showSearch?: boolean
  placeholder?: string
  style?: CSSProperties
  className?: string
}

const cache = new Map<string, Promise<DictOption[]>>()

function mapRows(rows: DictData[]): DictOption[] {
  return rows
    .filter((row) => row.status !== 0)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((row) => ({ label: row.label, value: row.value }))
}

export default function XnDictSelect({
  value,
  onChange,
  dictType = '',
  options,
  multiple = false,
  allowClear = true,
  disabled = false,
  showSearch = true,
  placeholder = '请选择',
  style,
  className,
}: XnDictSelectProps) {
  const [loading, setLoading] = useState(false)
  const [remote, setRemote] = useState<DictOption[]>([])
  const type = options ? '' : (dictType || '').trim()
  const [activeType, setActiveType] = useState(type)
  const resolved = options ?? remote

  if (activeType !== type) {
    setActiveType(type)
    setRemote([])
    setLoading(!!type)
  }

  useEffect(() => {
    if (!type) return
    let cancelled = false
    if (!cache.has(type)) {
      cache.set(
        type,
        getByType(type)
          .then((res) => mapRows(res.data || []))
          .catch((error) => {
            cache.delete(type)
            throw error
          }),
      )
    }
    void cache
      .get(type)!
      .then((rows) => {
        if (!cancelled) setRemote(rows)
      })
      .catch(() => {
        if (!cancelled) setRemote([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [type])

  return (
    <Select
      className={className}
      style={{ width: '100%', ...style }}
      value={value === '' || value == null ? undefined : value}
      mode={multiple ? 'multiple' : undefined}
      allowClear={allowClear}
      disabled={disabled}
      showSearch={showSearch}
      optionFilterProp="label"
      placeholder={placeholder}
      loading={loading}
      options={resolved}
      onChange={(next) => onChange?.(next as DictSelectValue)}
    />
  )
}
