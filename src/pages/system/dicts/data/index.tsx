import { useEffect, useRef, useState } from 'react'
import { Button, Tag, message, Modal } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import { usePageUi } from '@/hooks/usePageUi'
import { list, batchRemove, remove } from '@/api/dict-data'
import type { DictData } from '@/types'
import type { SearchForm } from '@/types/search'
import type { SaveMode } from '@/types/save'
import type { TableColumnItem } from '@/types/table'
import DictDataSave, { type DictDataSaveHandle } from './save'

const TAG_COLORS: Record<string, string> = {
  primary: 'blue',
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'default',
}

export default function DictDataPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const dictType = params.get('dictType') || ''
  const dictName = params.get('dictName') || dictType
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/dicts/data')
  const saveRef = useRef<DictDataSaveHandle>(null)
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState<DictData[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [selected, setSelected] = useState<DictData[]>([])

  const columns: TableColumnItem[] = [
    { type: 'selection', width: 50, fixed: true },
    { type: 'slot', slot: 'preview', prop: 'label', label: '字典标签', minWidth: 140 },
    { prop: 'value', label: '字典键值', minWidth: 140 },
    { prop: 'sort', label: '排序', width: 80 },
    { type: 'slot', slot: 'isDefault', prop: 'isDefault', label: '默认', width: 90 },
    {
      prop: 'status',
      label: '状态',
      width: 100,
      type: 'tag',
      options: [
        { value: 1, label: '启用', type: 'success' },
        { value: 0, label: '禁用', type: 'danger' },
      ],
    },
    { prop: 'remark', label: '备注', minWidth: 160, showOverflowTooltip: true },
    { type: 'slot', slot: 'actions', label: '操作', fixed: 'right' },
  ]

  function openSave(mode: SaveMode, id?: number) {
    void saveRef.current?.open(mode, id)
  }

  async function loadData(nextPage = page, nextSize = size, nextQuery = queryForm) {
    if (!dictType) return
    setLoading(true)
    try {
      const res = await list({
        dictType,
        page: nextPage - 1,
        size: nextSize,
        keyword: String(nextQuery.FuzzyWord ?? '').trim() || undefined,
        status: nextQuery.status as number | string | undefined,
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
  }, [dictType])

  async function handleDelete(row: DictData) {
    Modal.confirm({
      title: '删除确认',
      content: `确定删除字典数据「${row.label}」吗？`,
      okType: 'danger',
      okText: '删除',
      onOk: async () => {
        await remove(row.id)
        message.success('删除成功')
        await loadData()
      },
    })
  }

  async function handleBatchDelete() {
    if (!selected.length) {
      message.warning('请至少选择一项')
      return
    }
    Modal.confirm({
      title: '删除确认',
      content: `确定删除选中的 ${selected.length} 条字典数据吗？`,
      okType: 'danger',
      okText: '删除',
      onOk: async () => {
        await batchRemove(selected.map((r) => r.id))
        message.success('删除成功')
        setSelected([])
        await loadData()
      },
    })
  }

  function buttonClick(action: string) {
    if (action === 'add') openSave('add')
    else if (action === 'edit') {
      if (selected.length !== 1) {
        message.warning('请选择一项操作')
        return
      }
      openSave('edit', selected[0].id)
    } else if (action === 'view') {
      if (selected.length !== 1) {
        message.warning('请选择一项操作')
        return
      }
      openSave('view', selected[0].id)
    } else if (action === 'delete') void handleBatchDelete()
  }

  return (
    <>
      <XnPageLayout
        showViewSwitch={false}
        search={
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/system/dicts')}>
                返回
              </Button>
              <span>
                字典数据：<strong>{dictName}</strong>{' '}
                <code
                  style={{
                    fontSize: 12,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(0,0,0,0.04)',
                    marginLeft: 6,
                  }}
                >
                  {dictType}
                </code>
              </span>
            </div>
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
          </>
        }
        toolbar={<XnButton listItem={buttonItems} selected={selected} onButtonClick={buttonClick} />}
        table={
          <XnTable
            data={tableData}
            total={total}
            loading={loading}
            page={page}
            pageSize={size}
            tableKey="system:dicts:data"
            entityName="字典数据"
            nameField="label"
            columns={columns}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as DictData[])}
            onPageChange={(p, s) => {
              setPage(p)
              setSize(s)
              void loadData(p, s)
            }}
            slots={{
              preview: ({ row }) => {
                const d = row as unknown as DictData
                return <Tag color={TAG_COLORS[d.listClass || ''] || undefined}>{d.label}</Tag>
              },
              isDefault: ({ row }) =>
                (row as unknown as DictData).isDefault ? (
                  <Tag color="success">默认</Tag>
                ) : (
                  <span style={{ color: '#94a3b8' }}>—</span>
                ),
              actions: ({ row }) => (
                <XnTableActions
                  items={tableButtonItems}
                  row={row}
                  onActionClick={({ action, row: r }) => {
                    const d = r as unknown as DictData
                    if (action === 'edit') openSave('edit', d.id)
                    else if (action === 'view') openSave('view', d.id)
                    else if (action === 'delete') void handleDelete(d)
                  }}
                />
              ),
            }}
          />
        }
      />
      <DictDataSave ref={saveRef} dictType={dictType} onSuccess={() => void loadData()} />
    </>
  )
}
