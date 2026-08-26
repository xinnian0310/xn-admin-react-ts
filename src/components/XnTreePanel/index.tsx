import { useMemo, useState, type Key, type ReactNode } from 'react'
import { Input, Tree } from 'antd'
import type { DataNode } from 'antd/es/tree'

interface XnTreePanelProps<T extends Record<string, unknown> = Record<string, unknown>> {
  title?: string
  width?: string | number
  /** 是否显示搜索框，默认 true；自定义内容（如表单）时可关掉 */
  filterable?: boolean
  filter?: string
  onFilterChange?: (value: string) => void
  filterPlaceholder?: string
  data?: T[]
  treeProps?: { label?: string; children?: string; key?: string; disabled?: string }
  currentKey?: string | number
  onNodeClick?: (node: T) => void
  /** 自定义中间内容；传入后不再渲染内置 Tree */
  children?: ReactNode
  /** 底部固定区（不随中间内容滚动） */
  footer?: ReactNode
}

function filterTree<T extends Record<string, unknown>>(
  nodes: T[],
  keyword: string,
  labelKey: string,
  childrenKey: string,
): T[] {
  if (!keyword.trim()) return nodes
  const kw = keyword.trim().toLowerCase()
  const walk = (list: T[]): T[] => {
    const result: T[] = []
    for (const node of list) {
      const children = (node[childrenKey] as T[] | undefined) || []
      const filteredChildren = walk(children)
      const label = String(node[labelKey] ?? '').toLowerCase()
      if (label.includes(kw) || filteredChildren.length) {
        result.push({
          ...node,
          [childrenKey]: filteredChildren.length ? filteredChildren : children,
        })
      }
    }
    return result
  }
  return walk(nodes)
}

function collectKeys(nodes: DataNode[]): Key[] {
  const keys: Key[] = []
  const walk = (list: DataNode[]) => {
    for (const n of list) {
      keys.push(n.key)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return keys
}

export default function XnTreePanel<T extends Record<string, unknown>>({
  title,
  width = 240,
  filterable = true,
  filter = '',
  onFilterChange,
  filterPlaceholder = '搜索',
  data = [],
  treeProps,
  currentKey,
  onNodeClick,
  children,
  footer,
}: XnTreePanelProps<T>) {
  const labelKey = treeProps?.label || 'name'
  const childrenKey = treeProps?.children || 'children'
  const keyField = treeProps?.key || 'id'
  const disabledKey = treeProps?.disabled
  const [innerFilter, setInnerFilter] = useState(filter)
  const keyword = onFilterChange ? filter : innerFilter

  const filtered = useMemo(
    () => filterTree(data, keyword, labelKey, childrenKey),
    [data, keyword, labelKey, childrenKey],
  )

  const treeData: DataNode[] = useMemo(() => {
    const mapNodes = (nodes: T[]): DataNode[] =>
      nodes.map((n) => ({
        key: String(n[keyField]),
        title: String(n[labelKey] ?? ''),
        disabled: disabledKey ? Boolean(n[disabledKey]) : undefined,
        children: Array.isArray(n[childrenKey]) ? mapNodes(n[childrenKey] as T[]) : undefined,
        raw: n,
      }))
    return mapNodes(filtered)
  }, [filtered, keyField, labelKey, childrenKey, disabledKey])

  const allKeys = useMemo(() => collectKeys(treeData), [treeData])
  const allKeysSig = allKeys.join('|')
  const [expandedKeys, setExpandedKeys] = useState<Key[]>(allKeys)
  const [prevKeysSig, setPrevKeysSig] = useState(allKeysSig)

  if (prevKeysSig !== allKeysSig) {
    setPrevKeysSig(allKeysSig)
    setExpandedKeys(allKeysSig ? allKeysSig.split('|') : [])
  }

  return (
    <div
      style={{
        width,
        padding: 12,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {title ? <div style={{ flexShrink: 0, fontWeight: 600 }}>{title}</div> : null}
      {filterable ? (
        <div style={{ flexShrink: 0 }}>
          <Input
            allowClear
            placeholder={filterPlaceholder}
            value={keyword}
            onChange={(e) => {
              const v = e.target.value
              if (onFilterChange) onFilterChange(v)
              else setInnerFilter(v)
            }}
          />
        </div>
      ) : null}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {children ?? (
          <Tree
            treeData={treeData}
            selectedKeys={currentKey != null ? [String(currentKey)] : []}
            expandedKeys={expandedKeys}
            onExpand={(keys) => setExpandedKeys(keys)}
            onSelect={(_keys, info) => {
              const raw = (info.node as DataNode & { raw?: T }).raw
              if (raw) onNodeClick?.(raw)
            }}
          />
        )}
      </div>
      {footer ? (
        <div
          style={{
            flexShrink: 0,
            paddingTop: 8,
            borderTop: '1px solid var(--app-border-color, #f0f0f0)',
          }}
        >
          {footer}
        </div>
      ) : null}
    </div>
  )
}
