import { useEffect, useMemo, useState } from 'react'
import { Button, Radio, Tag } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnTable from '@/components/XnTable'
import { getApiRegistry } from '@/api/auth'
import type { SearchForm, SearchItem } from '@/types/search'
import type { TableColumnItem } from '@/types/table'

type ApiItem = { method: string; path: string }
type DocsMode = 'ui' | 'api'

const MODE_KEY = 'xn-api-docs-mode'

function readStoredMode(): DocsMode {
  return localStorage.getItem(MODE_KEY) === 'api' ? 'api' : 'ui'
}

function methodColor(method: string): string {
  const m = (method || '').toUpperCase()
  if (m === 'GET') return 'success'
  if (m === 'POST') return 'processing'
  if (m === 'PUT' || m === 'PATCH') return 'warning'
  if (m === 'DELETE') return 'error'
  return 'default'
}

const searchItems: SearchItem[] = [
  {
    label: '方法',
    prop: 'method',
    type: 'select',
    placeholder: '全部方法',
    clearable: true,
    width: 140,
    options: [
      { label: 'GET', value: 'GET' },
      { label: 'POST', value: 'POST' },
      { label: 'PUT', value: 'PUT' },
      { label: 'PATCH', value: 'PATCH' },
      { label: 'DELETE', value: 'DELETE' },
    ],
  },
  {
    label: '路径',
    prop: 'keyword',
    type: 'input',
    placeholder: '搜索路径关键字',
    width: 280,
  },
]

const columns: TableColumnItem[] = [
  { type: 'index', label: '#', width: 60, align: 'center' },
  { type: 'slot', slot: 'method', prop: 'method', label: '方法', width: 110 },
  { prop: 'path', label: '路径', minWidth: 360, showOverflowTooltip: true },
]

export default function SystemApiDocsPage() {
  const [mode, setMode] = useState<DocsMode>(readStoredMode)
  const [loading, setLoading] = useState(false)
  const [apis, setApis] = useState<ApiItem[]>([])
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [swaggerTick, setSwaggerTick] = useState(0)

  const swaggerSrc = `/swagger-ui/index.html?t=${swaggerTick}`
  const modeHint =
    mode === 'ui'
      ? 'Swagger UI：在线查看与调试 OpenAPI 接口'
      : 'API 登记：权限系统扫描到的方法/路径（供角色权限对照）'

  const filteredApis = useMemo(() => {
    const method = String(queryForm.method ?? '')
      .trim()
      .toUpperCase()
    const keyword = String(queryForm.keyword ?? '')
      .trim()
      .toLowerCase()
    return apis.filter((a) => {
      if (method && a.method.toUpperCase() !== method) return false
      if (!keyword) return true
      return a.path.toLowerCase().includes(keyword) || a.method.toLowerCase().includes(keyword)
    })
  }, [apis, queryForm])

  const pagedApis = useMemo(() => {
    const start = (page - 1) * size
    return filteredApis.slice(start, start + size)
  }, [filteredApis, page, size])

  async function loadApis() {
    setLoading(true)
    try {
      const res = await getApiRegistry()
      const list = [...(res.data?.apis || [])].sort((a, b) =>
        `${a.path}${a.method}`.localeCompare(`${b.path}${b.method}`),
      )
      setApis(list)
    } finally {
      setLoading(false)
    }
  }

  function changeMode(next: DocsMode) {
    setMode(next)
    localStorage.setItem(MODE_KEY, next)
    if (next === 'api' && !apis.length) void loadApis()
    if (next === 'ui') setSwaggerTick(Date.now())
  }

  useEffect(() => {
    if (mode === 'api') void loadApis()
    else setSwaggerTick(Date.now())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <XnPageLayout
      showViewSwitch={false}

      toolbar={
        <span style={{ fontSize: 13, color: 'var(--app-text-muted, #909399)' }}>{modeHint}</span>
      }
      toolbarExtra={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Radio.Group
            value={mode}
            optionType="button"
            options={[
              { label: 'UI', value: 'ui' },
              { label: 'API', value: 'api' },
            ]}
            onChange={(e) => changeMode(e.target.value as DocsMode)}
          />
          {mode === 'ui' ? (
            <Button href="/swagger-ui/index.html" target="_blank" rel="noopener noreferrer">
              新窗口打开
            </Button>
          ) : null}
        </div>
      }
      search={
        mode === 'api' ? (
          <XnSearch
            searchItem={searchItems}
            onQueryForm={(form) => {
              setQueryForm(form)
              setPage(1)
            }}
            onReset={() => {
              setQueryForm({})
              setPage(1)
            }}
          />
        ) : undefined
      }
      table={
        mode === 'api' ? (
          <XnTable
            data={pagedApis as unknown as Record<string, unknown>[]}
            total={filteredApis.length}
            loading={loading}
            page={page}
            pageSize={size}
            tableKey="system:api-docs"
            entityName="接口"
            nameField="path"
            columns={columns}
            actionItems={[]}
            onPageChange={(p, s) => {
              setPage(p)
              setSize(s)
            }}
            slots={{
              method: ({ row }) => (
                <Tag color={methodColor(String(row.method ?? ''))}>{String(row.method ?? '')}</Tag>
              ),
            }}
          />
        ) : undefined
      }
    >
      {mode === 'ui' ? (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <iframe
            title="Swagger UI"
            src={swaggerSrc}
            style={{
              flex: 1,
              width: '100%',
              minHeight: 640,
              height: '100%',
              border: '1px solid var(--app-border-color, #d9d9d9)',
              borderRadius: 8,
              background: 'var(--app-card-bg, #fff)',
            }}
          />
        </div>
      ) : null}
    </XnPageLayout>
  )
}
