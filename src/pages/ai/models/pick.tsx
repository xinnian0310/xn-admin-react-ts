import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import { Input, Table, message } from 'antd'
import type { TableRowSelection } from 'antd/es/table/interface'
import XnDialog from '@/components/XnDialog'
import { createModel, listRemoteModels } from '@/api/ai/model'
import type { ProviderCatalog, RemoteModelItem } from '@/types/ai/model'
import { showCaughtError } from '@/utils/request'
import './models.scss'

export interface ModelPickHandle {
  open: (target: ProviderCatalog) => Promise<void>
}

interface Props {
  onSuccess?: () => void
}

const ModelPick = forwardRef<ModelPickHandle, Props>(function ModelPick({ onSuccess }, ref) {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [hint, setHint] = useState('')
  const [provider, setProvider] = useState<ProviderCatalog | null>(null)
  const [rows, setRows] = useState<RemoteModelItem[]>([])
  const [selected, setSelected] = useState<RemoteModelItem[]>([])

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    const pending = rows.filter((row) => !row.boundId)
    if (!q) return pending
    return pending.filter((row) => {
      const name = (row.name || row.displayName || row.modelId).toLowerCase()
      return name.includes(q) || row.modelId.toLowerCase().includes(q)
    })
  }, [keyword, rows])

  function reset() {
    setKeyword('')
    setHint('')
    setProvider(null)
    setRows([])
    setSelected([])
  }

  useImperativeHandle(ref, () => ({
    async open(target) {
      reset()
      setProvider(target)
      setVisible(true)
      setLoading(true)
      try {
        const res = await listRemoteModels(target.id)
        setRows(res.data?.models ?? [])
        setHint(res.data?.message || '')
      } catch (e) {
        setRows([])
        showCaughtError(e, '拉取模型失败')
      } finally {
        setLoading(false)
      }
    },
  }))

  async function onAddSelected() {
    if (!provider || !selected.length) {
      message.warning('请选择要添加的模型')
      return
    }
    setAdding(true)
    let ok = 0
    try {
      for (const row of selected) {
        if (row.boundId) continue
        await createModel({
          providerId: provider.id,
          modelId: row.modelId,
        })
        setRows((prev) =>
          prev.map((item) =>
            item.modelId === row.modelId ? { ...item, boundId: 'pending' } : item,
          ),
        )
        ok += 1
      }
      if (ok) {
        message.success(`已添加 ${ok} 个模型`)
        onSuccess?.()
        setVisible(false)
        return
      }
      setSelected([])
    } catch (e) {
      if (ok) {
        onSuccess?.()
        setVisible(false)
      }
      showCaughtError(e, ok ? `已添加 ${ok} 个，其余添加失败` : '添加失败')
    } finally {
      setAdding(false)
    }
  }

  const rowSelection: TableRowSelection<RemoteModelItem> = {
    selectedRowKeys: selected.map((row) => row.modelId),
    onChange: (_keys, rowsSelected) => setSelected(rowsSelected),
  }

  return (
    <XnDialog
      title={provider ? `添加模型 · ${provider.name}` : '添加模型'}
      open={visible}
      width={720}
      destroyOnClose
      onCancel={() => setVisible(false)}
      afterClose={reset}
      confirmText={selected.length ? `添加（${selected.length}）` : '添加'}
      confirmLoading={adding}
      confirmDisabled={!selected.length}
      onConfirm={() => void onAddSelected()}
    >
      <Input
        className="pick-search"
        allowClear
        placeholder="搜索模型名称 / 模型 ID"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <Table
        rowKey="modelId"
        loading={loading}
        dataSource={filtered}
        rowSelection={rowSelection}
        pagination={false}
        size="middle"
        scroll={{ y: 360 }}
        locale={{ emptyText: '该厂商暂无待添加模型' }}
        columns={[
          {
            title: '模型名称',
            minWidth: 220,
            ellipsis: true,
            render: (_v, row) => row.name || row.displayName,
          },
          { title: '模型 ID', dataIndex: 'modelId', minWidth: 180, ellipsis: true },
        ]}
      />
      {hint ? <p className="pick-msg">{hint}</p> : null}
    </XnDialog>
  )
})

export default ModelPick
