import { useEffect, useMemo, useState, type Key } from 'react'
import { Input, Tree } from 'antd'
import type { DataNode } from 'antd/es/tree'

interface XnTreePanelProps<T extends Record<string, unknown> = Record<string, unknown>> {
  title?: string
  width?: string | number
  filter?: string
  onFilterChange?: (value: string) => void
  filterPlaceholder?: string
  data?: T[]
  treeProps?: { label?: string; children?: string; key?: string }
  currentKey?: string | number
  onNodeClick?: (node: T) => void
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
  filter = '',
  onFilterChange,
  filterPlaceholder = '搜索',
  data = [],
  treeProps,
  currentKey,
  onNodeClick,
}: XnTreePanelProps<T>) {
  const labelKey = treeProps?.label || 'name'
  const childrenKey = treeProps?.children || 'children'
  const keyField = treeProps?.key || 'id'
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
        children: Array.isArray(n[childrenKey]) ? mapNodes(n[childrenKey] as T[]) : undefined,
        raw: n,
      }))
    return mapNodes(filtered)
  }, [filtered, keyField, labelKey, childrenKey])

  const allKeys = useMemo(() => collectKeys(treeData), [treeData])
  const allKeysSig = allKeys.join('|')
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([])

  // 异步数据到达后仍默认全部展开（antd defaultExpandAll 仅首挂载生效）
  useEffect(() => {
    setExpandedKeys(allKeysSig ? allKeysSig.split('|') : [])
  }, [allKeysSig])

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
      }}
    >
      {title ? <div style={{ fontWeight: 600 }}>{title}</div> : null}
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
      <div style={{ flex: 1, overflow: 'auto' }}>
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
      </div>
    </div>
  )
}
