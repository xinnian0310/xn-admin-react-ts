import { useEffect, useState } from 'react'
import { Tag, message, Modal } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import { usePageUi } from '@/hooks/usePageUi'
import {
  batchPurgeRecycle,
  cleanRecycle,
  listRecycle,
  purgeRecycle,
  restoreRecycle,
} from '@/api/recycle'
import type { RecycleBinItem } from '@/types/recycle'
import type { SearchForm } from '@/types/search'
import type { TableColumnItem } from '@/types/table'

function bizTypeLabel(type?: string) {
  if (type === 'USER') return '用户'
  if (type === 'FILE') return '文件'
  return type || '-'
}

export default function SystemRecyclePage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/recycle')
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState<RecycleBinItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [selected, setSelected] = useState<RecycleBinItem[]>([])

  const columns: TableColumnItem[] = [
    { type: 'selection', width: 50, fixed: true },
    { type: 'slot', slot: 'bizType', prop: 'bizType', label: '类型', width: 100 },
    { prop: 'title', label: '标题', minWidth: 160 },
    { prop: 'summary', label: '摘要', minWidth: 200, showOverflowTooltip: true },
    { prop: 'deletedBy', label: '删除人', minWidth: 110 },
    { prop: 'deletedAt', label: '删除时间', minWidth: 170, type: 'datetime' },
    { type: 'slot', slot: 'actions', label: '操作', width: 160, fixed: 'right' },
  ]

  async function loadData(nextPage = page, nextSize = size, nextQuery = queryForm) {
    setLoading(true)
    try {
      const res = await listRecycle({
        page: nextPage - 1,
        size: nextSize,
        keyword: String(nextQuery.FuzzyWord ?? '').trim() || undefined,
        bizType: String(nextQuery.bizType ?? '').trim() || undefined,
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

  async function handleRestore(row: RecycleBinItem) {
    Modal.confirm({
      title: '恢复确认',
      content: `确定恢复「${row.title}」吗？`,
      onOk: async () => {
        await restoreRecycle(row.id)
        message.success('已恢复')
        await loadData()
      },
    })
  }

  async function handlePurge(row: RecycleBinItem) {
    Modal.confirm({
      title: '彻底删除',
      content: `确定彻底删除「${row.title}」吗？此操作不可恢复。`,
      okType: 'danger',
      onOk: async () => {
        await purgeRecycle(row.id)
        message.success('已彻底删除')
        await loadData()
      },
    })
  }

  async function handleBatchPurge() {
    if (!selected.length) {
      message.warning('请至少选择一项')
      return
    }
    Modal.confirm({
      title: '彻底删除',
      content: `确定彻底删除选中的 ${selected.length} 项吗？此操作不可恢复。`,
      okType: 'danger',
      onOk: async () => {
        await batchPurgeRecycle(selected.map((r) => r.id))
        message.success('已彻底删除')
        setSelected([])
        await loadData()
      },
    })
  }

  function buttonClick(action: string) {
    if (action === 'restore') {
      if (selected.length !== 1) {
        message.warning('请选择一项恢复')
        return
      }
      void handleRestore(selected[0])
    } else if (action === 'purge') {
      void handleBatchPurge()
    } else if (action === 'clean') {
      Modal.confirm({
        title: '清空确认',
        content: '确定清空回收站并彻底删除全部内容吗？此操作不可恢复。',
        okType: 'danger',
        onOk: async () => {
          await cleanRecycle()
          message.success('回收站已清空')
          await loadData()
        },
      })
    }
  }

  return (
    <XnPageLayout
      showViewSwitch={false}
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
          data={tableData as unknown as Record<string, unknown>[]}
          total={total}
          loading={loading}
          page={page}
          pageSize={size}
          tableKey="system:recycle"
          entityName="回收站"
          nameField="title"
          columns={columns}
          actionItems={tableButtonItems}
          onSelectionChange={(rows) => setSelected(rows as unknown as RecycleBinItem[])}
          onPageChange={(p, s) => {
            setPage(p)
            setSize(s)
            void loadData(p, s)
          }}
          onRefresh={() => void loadData()}
          slots={{
            bizType: ({ row }) => (
              <Tag color={row.bizType === 'USER' ? 'warning' : 'processing'}>
                {bizTypeLabel(String(row.bizType ?? ''))}
              </Tag>
            ),
            actions: ({ row }) => (
              <XnTableActions
                items={tableButtonItems}
                row={row}
                onActionClick={({ action, row: r }) => {
                  const item = r as unknown as RecycleBinItem
                  if (action === 'restore') void handleRestore(item)
                  else if (action === 'purge') void handlePurge(item)
                }}
              />
            ),
          }}
        />
      }
    />
  )
}
