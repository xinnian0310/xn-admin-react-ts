import { useEffect, useRef, useState } from 'react'
import { Card, Tag, message, Modal } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import XnImport, { type XnImportHandle } from '@/components/XnImport'
import PostSave, { type PostSaveHandle } from './save'
import { usePageUi } from '@/hooks/usePageUi'
import { list, remove, batchRemove, importPosts, exportPosts } from '@/api/post'
import type { Post } from '@/types/post'
import type { ExcelImportColumn } from '@/types/excel'
import type { SearchForm } from '@/types/search'
import type { SaveMode } from '@/types/save'
import type { TableColumnItem } from '@/types/table'

const importColumns: ExcelImportColumn[] = [
  { key: 'code', title: '岗位编码', required: true, example: 'engineer', width: 14 },
  { key: 'name', title: '岗位名称', required: true, example: '工程师', width: 14 },
  { key: 'sort', title: '排序', example: '0', width: 10 },
  {
    key: 'status',
    title: '状态',
    example: '启用',
    width: 10,
    options: [
      { label: '启用', value: '1' },
      { label: '停用', value: '0' },
    ],
  },
  { key: 'remark', title: '备注', example: '', width: 20 },
]

export default function PostsPage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/posts')
  const saveRef = useRef<PostSaveHandle>(null)
  const importRef = useRef<XnImportHandle>(null)
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [selected, setSelected] = useState<Post[]>([])

  const columns: TableColumnItem[] = [
    { type: 'selection', width: 50 },
    { prop: 'name', label: '名称', minWidth: 140 },
    { type: 'slot', slot: 'code', prop: 'code', label: '编码', minWidth: 120 },
    { prop: 'sort', label: '排序', width: 90 },
    {
      type: 'tag',
      prop: 'status',
      label: '状态',
      width: 100,
      options: [
        { value: 1, label: '启用', type: 'success' },
        { value: 0, label: '停用', type: 'info' },
      ],
    },
    {
      type: 'tag',
      prop: 'builtIn',
      label: '类型',
      width: 100,
      options: [
        { value: true, label: '内置', type: 'warning' },
        { value: false, label: '自定义', type: 'info' },
      ],
    },
    { prop: 'remark', label: '备注', minWidth: 160, showOverflowTooltip: true },
    { type: 'slot', slot: 'actions', label: '操作', fixed: 'right', width: 160 },
  ]

  async function loadData(nextPage = page, nextSize = size, nextQuery = queryForm) {
    setLoading(true)
    try {
      const statusRaw = nextQuery.status
      const status =
        statusRaw === '' || statusRaw == null ? undefined : Number(statusRaw)
      const res = await list({
        page: nextPage - 1,
        size: nextSize,
        keyword: String(nextQuery.FuzzyWord ?? '').trim() || undefined,
        status: Number.isFinite(status) ? status : undefined,
      })
      setTableData(res.data.records)
      setTotal(res.data.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openSave(mode: SaveMode, id?: number) {
    void saveRef.current?.open(mode, id)
  }

  function tableActionDisabled(action: string, row: Record<string, unknown>) {
    if (action === 'delete' && row.builtIn) return '内置岗位不可删除'
    return false
  }

  async function handleDelete(row: Post) {
    if (row.builtIn) {
      message.warning('内置岗位不可删除')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定删除岗位「${row.name}」吗？`,
      okType: 'danger',
      onOk: async () => {
        await remove(row.id)
        message.success('删除成功')
        await loadData()
      },
    })
  }

  async function handleBatchDelete() {
    if (!selected.length) {
      message.warning('请选择要删除的数据')
      return
    }
    if (selected.some((p) => p.builtIn)) {
      message.warning('选中项包含内置岗位，不可删除')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定删除选中的 ${selected.length} 个岗位吗？`,
      okType: 'danger',
      onOk: async () => {
        await batchRemove(selected.map((p) => p.id))
        message.success('删除成功')
        setSelected([])
        await loadData()
      },
    })
  }

  function buttonClick(action: string) {
    if (action === 'add') {
      openSave('add')
      return
    }
    if (action === 'import') {
      importRef.current?.open()
      return
    }
    if (action === 'export') {
      void exportPosts({
        keyword: String(queryForm.FuzzyWord ?? '').trim() || undefined,
        status:
          queryForm.status === '' || queryForm.status == null
            ? undefined
            : Number(queryForm.status),
      }).then(() => message.success('导出成功'))
      return
    }
    if (action === 'edit' || action === 'view') {
      if (selected.length !== 1) {
        message.warning('请选择一项操作')
        return
      }
      openSave(action, selected[0].id)
      return
    }
    if (action === 'delete') void handleBatchDelete()
  }

  return (
    <>
      <XnPageLayout
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showPagination={viewMode === 'card'}
        page={page}
        pageSize={size}
        total={total}
        loading={viewMode === 'card' ? loading : false}
        onPageChange={(p, s) => {
          setPage(p)
          setSize(s)
          void loadData(p, s)
        }}
        search={
          <XnSearch
            searchItem={searchItems}
            onQueryForm={(form) => {
              setQueryForm(form)
              setPage(1)
              void loadData(1, size, form)
            }}
            onReset={(form) => {
              setQueryForm(form)
              setPage(1)
              void loadData(1, size, form)
            }}
          />
        }
        toolbar={<XnButton listItem={buttonItems} selected={selected} onButtonClick={buttonClick} />}
        table={
          <XnTable
            data={tableData}
            total={total}
            loading={loading}
            page={page}
            pageSize={size}
            tableKey="system:posts"
            entityName="岗位"
            columns={columns}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as Post[])}
            onPageChange={(p, s) => {
              setPage(p)
              setSize(s)
              void loadData(p, s)
            }}
            slots={{
              code: ({ row }) => (
                <code style={{ color: 'var(--app-color-primary)' }}>{String(row.code)}</code>
              ),
              actions: ({ row }) => (
                <XnTableActions
                  items={tableButtonItems}
                  row={row}
                  disabled={tableActionDisabled}
                  onActionClick={({ action, row: r }) => {
                    const p = r as unknown as Post
                    if (action === 'delete') void handleDelete(p)
                    else if (action === 'edit' || action === 'view') openSave(action, p.id)
                  }}
                />
              ),
            }}
          />
        }
        card={
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 12,
            }}
          >
            {tableData.map((row) => (
              <Card key={row.id} size="small" title={row.name}>
                <div>
                  编码：<code>{row.code}</code>
                </div>
                <div>
                  <Tag color={row.status === 1 ? 'success' : 'default'}>
                    {row.status === 1 ? '启用' : '停用'}
                  </Tag>
                  <Tag color={row.builtIn ? 'warning' : 'default'}>
                    {row.builtIn ? '内置' : '自定义'}
                  </Tag>
                </div>
                <div style={{ marginTop: 8 }}>
                  <XnTableActions
                    items={tableButtonItems}
                    row={row as unknown as Record<string, unknown>}
                    disabled={tableActionDisabled}
                    onActionClick={({ action, row: r }) => {
                      const p = r as unknown as Post
                      if (action === 'delete') void handleDelete(p)
                      else if (action === 'edit' || action === 'view') openSave(action, p.id)
                    }}
                  />
                </div>
              </Card>
            ))}
          </div>
        }
      />
      <PostSave ref={saveRef} onSuccess={() => void loadData()} />
      <XnImport
        ref={importRef}
        title="导入岗位"
        templateName="岗位导入模板"
        columns={importColumns}
        importer={async (rows) => {
          const payload = rows.map((row) => ({
            code: row.code,
            name: row.name,
            sort: row.sort === '' || row.sort == null ? undefined : Number(row.sort),
            status: row.status === '' || row.status == null ? undefined : Number(row.status),
            remark: row.remark || undefined,
          }))
          const res = await importPosts(payload)
          return res.data
        }}
        onSuccess={() => void loadData()}
      />
    </>
  )
}
