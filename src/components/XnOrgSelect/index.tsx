import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Select, TreeSelect } from 'antd'
import { list as listUnits } from '@/api/unit'
import { list as listUsers } from '@/api/user'
import { getOptions as listRoles } from '@/api/role'
import { getOptions as listPosts } from '@/api/post'

export type OrgSelectType = 'unit' | 'user' | 'role' | 'post'
export type OrgOption = { id: number; label: string }
export type OrgTreeNode = { id: number; name: string; children?: OrgTreeNode[] }

export type OrgSelectValue = number | number[] | string | string[] | null | undefined

export type XnOrgSelectProps = {
  value?: OrgSelectValue
  onChange?: (value: OrgSelectValue) => void
  type?: OrgSelectType
  /** 本地选项，传入后不请求接口 */
  options?: OrgOption[]
  treeData?: OrgTreeNode[]
  multiple?: boolean
  allowClear?: boolean
  disabled?: boolean
  showSearch?: boolean
  placeholder?: string
  style?: CSSProperties
}

function defaultPlaceholder(type: OrgSelectType) {
  if (type === 'unit') return '请选择单位'
  if (type === 'user') return '请选择用户'
  if (type === 'role') return '请选择角色'
  if (type === 'post') return '请选择岗位'
  return '请选择'
}

export default function XnOrgSelect({
  value,
  onChange,
  type = 'unit',
  options,
  treeData,
  multiple = false,
  allowClear = true,
  disabled = false,
  showSearch = true,
  placeholder = '',
  style,
}: XnOrgSelectProps) {
  const [loading, setLoading] = useState(false)
  const [remoteList, setRemoteList] = useState<OrgOption[]>([])
  const [remoteTree, setRemoteTree] = useState<OrgTreeNode[]>([])

  const list = options ?? remoteList
  const tree = treeData ?? remoteTree
  const hint = placeholder || defaultPlaceholder(type)

  const selectOptions = useMemo(
    () => list.map((item) => ({ value: item.id, label: item.label })),
    [list],
  )

  useEffect(() => {
    let cancelled = false

    async function searchUsers(keyword: string) {
      if (options) return
      setLoading(true)
      try {
        const res = await listUsers({ page: 1, size: 50, keyword: keyword.trim() || undefined })
        if (cancelled) return
        setRemoteList(
          (res.data?.records || []).map((item) => ({
            id: item.id,
            label: item.nickname ? `${item.nickname}（${item.username}）` : item.username,
          })),
        )
      } catch {
        if (!cancelled) setRemoteList([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    async function load() {
      if (type === 'unit') {
        if (treeData) return
        setLoading(true)
        try {
          const res = await listUnits()
          if (!cancelled) setRemoteTree((res.data || []) as OrgTreeNode[])
        } catch {
          if (!cancelled) setRemoteTree([])
        } finally {
          if (!cancelled) setLoading(false)
        }
        return
      }
      if (options) return
      setLoading(true)
      try {
        if (type === 'role') {
          const res = await listRoles()
          if (!cancelled) {
            setRemoteList((res.data || []).map((item) => ({ id: item.id, label: item.name })))
          }
        } else if (type === 'post') {
          const res = await listPosts()
          if (!cancelled) {
            setRemoteList((res.data || []).map((item) => ({ id: item.id, label: item.name })))
          }
        } else {
          await searchUsers('')
          return
        }
      } catch {
        if (!cancelled) setRemoteList([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [type, options, treeData])

  async function handleUserSearch(keyword: string) {
    if (options || type !== 'user') return
    setLoading(true)
    try {
      const res = await listUsers({ page: 1, size: 50, keyword: keyword.trim() || undefined })
      setRemoteList(
        (res.data?.records || []).map((item) => ({
          id: item.id,
          label: item.nickname ? `${item.nickname}（${item.username}）` : item.username,
        })),
      )
    } catch {
      setRemoteList([])
    } finally {
      setLoading(false)
    }
  }

  if (type === 'unit') {
    return (
      <TreeSelect
        style={{ width: '100%', ...style }}
        value={value === null ? undefined : value}
        treeData={tree}
        fieldNames={{ label: 'name', value: 'id', children: 'children' }}
        multiple={multiple}
        disabled={disabled}
        allowClear={allowClear}
        showSearch={showSearch}
        treeDefaultExpandAll
        treeCheckable={multiple}
        treeCheckStrictly
        placeholder={hint}
        loading={loading}
        onChange={(next) => {
          if (multiple && Array.isArray(next)) {
            const ids = (next as unknown[]).map((item) =>
              item && typeof item === 'object' && 'value' in item
                ? (item as { value: number | string }).value
                : item,
            )
            onChange?.(ids as OrgSelectValue)
            return
          }
          onChange?.((next ?? null) as OrgSelectValue)
        }}
      />
    )
  }

  return (
    <Select
      style={{ width: '100%', ...style }}
      value={value === null ? undefined : value}
      mode={multiple ? 'multiple' : undefined}
      disabled={disabled}
      allowClear={allowClear}
      showSearch={showSearch}
      filterOption={
        type === 'user' && !options
          ? false
          : (input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
      }
      onSearch={type === 'user' && !options ? (kw) => void handleUserSearch(kw) : undefined}
      placeholder={hint}
      loading={loading}
      options={selectOptions}
      onChange={(next) => onChange?.((next ?? null) as OrgSelectValue)}
    />
  )
}
