import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Form, Input, message } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import XnModal from '@/components/XnModal'
import { usePageUi } from '@/hooks/usePageUi'
import { applyRemoteAppConfig, defaultAppConfig } from '@/config/app'
import {
  getSystemConfigSection,
  updateSystemConfigSection,
  type StorageItem,
  type SystemConfigPayload,
} from '@/api/system-config'
import { APP_CLIENT_ID } from '@/config/client'
import { showCaughtError } from '@/utils/request'
import type { SearchForm, SearchItem } from '@/types/search'
import type { TableColumnItem } from '@/types/table'
import type { ButtonListItem } from '@/types/button'

type StorageRow = StorageItem & { key: number }
type DialogMode = 'add' | 'edit' | 'view'

const SEARCH_FALLBACK: SearchItem[] = [
  { label: '综合查询', prop: 'FuzzyWord', type: 'input', placeholder: '名字 / 路径' },
]

const BUTTON_FALLBACK: ButtonListItem[] = [
  {
    name: '新增',
    type: 'button',
    action: 'add',
    icon: 'PlusOutlined',
    typeColor: 'primary',
    permission: 'remote-storage:create',
  },
  {
    name: '编辑',
    type: 'button',
    action: 'edit',
    icon: 'EditOutlined',
    typeColor: 'primary',
    index: 0,
    permission: 'remote-storage:update',
  },
  {
    name: '查看',
    type: 'button',
    action: 'view',
    icon: 'EyeOutlined',
    typeColor: 'primary',
    index: 0,
    permission: 'remote-storage:view',
  },
  {
    name: '删除',
    type: 'button',
    action: 'delete',
    icon: 'DeleteOutlined',
    typeColor: 'danger',
    permission: 'remote-storage:delete',
  },
]

const TABLE_BUTTON_FALLBACK: ButtonListItem[] = [
  {
    name: '编辑',
    type: 'button',
    action: 'edit',
    typeColor: 'primary',
    permission: 'remote-storage:update',
  },
  {
    name: '查看',
    type: 'button',
    action: 'view',
    typeColor: 'primary',
    permission: 'remote-storage:view',
  },
  {
    name: '删除',
    type: 'button',
    action: 'delete',
    typeColor: 'danger',
    permission: 'remote-storage:delete',
  },
]

const columns: TableColumnItem[] = [
  { type: 'selection', width: 50, fixed: true },
  { type: 'index', label: '#', width: 55 },
  { prop: 'name', label: '名字', width: 200, showOverflowTooltip: true },
  { prop: 'path', label: '路径', minWidth: 320, showOverflowTooltip: true },
  { type: 'slot', slot: 'actions', label: '操作', width: 180, fixed: 'right' },
]

const DIALOG_TITLE: Record<DialogMode, string> = {
  add: '新增远程连接',
  edit: '编辑远程连接',
  view: '查看远程连接',
}

export default function RemoteStoragePage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/remote-storage')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<StorageRow[]>([])
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<StorageRow[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DialogMode>('add')
  const [editingKey, setEditingKey] = useState<number | null>(null)
  const [draft, setDraft] = useState<StorageItem>({ name: '', path: '' })
  const [form] = Form.useForm<StorageItem>()
  const keySeed = useRef(0)

  const resolvedSearchItems = searchItems.length ? searchItems : SEARCH_FALLBACK
  const resolvedButtons = buttonItems.length ? buttonItems : BUTTON_FALLBACK
  const resolvedTableButtons = tableButtonItems.length ? tableButtonItems : TABLE_BUTTON_FALLBACK

  const filteredItems = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return items
    return items.filter(
      (item) => item.name.toLowerCase().includes(kw) || item.path.toLowerCase().includes(kw),
    )
  }, [items, keyword])

  const toRow = useCallback((item: Partial<StorageItem> | undefined): StorageRow => {
    keySeed.current += 1
    return {
      key: keySeed.current,
      name: String(item?.name || ''),
      path: String(item?.path || ''),
    }
  }, [])

  const mapToRows = useCallback(
    (map?: Record<string, unknown> | null): StorageRow[] => {
      const src = map && Object.keys(map).length ? map : defaultAppConfig.storage
      return Object.entries(src).map(([name, path]) => toRow({ name, path: String(path || '') }))
    },
    [toRow],
  )

  const applySection = useCallback(
    (data: unknown) => {
      const sectionItems = (data as { items?: StorageItem[] })?.items
      setItems(
        Array.isArray(sectionItems)
          ? sectionItems.map((item) => toRow(item))
          : mapToRows(data as Record<string, unknown>),
      )
      setSelected([])
    },
    [mapToRows, toRow],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getSystemConfigSection('storage')
      applySection(res.data)
    } catch (e: unknown) {
      showCaughtError(e, '加载失败')
    } finally {
      setLoading(false)
    }
  }, [applySection])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (dialogOpen) form.setFieldsValue(draft)
  }, [dialogOpen, draft, form])

  function withClientBrand(payload: SystemConfigPayload): SystemConfigPayload {
    const clientName =
      payload.app?.clients?.[APP_CLIENT_ID]?.name || payload.app?.name || defaultAppConfig.app.name
    const clientIntro = payload.app?.clients?.[APP_CLIENT_ID]?.intro ?? payload.app?.intro ?? ''
    return { ...payload, app: { ...payload.app, name: clientName, intro: clientIntro } }
  }

  function openDialog(mode: DialogMode, row?: StorageRow) {
    setDialogMode(mode)
    setEditingKey(row ? row.key : null)
    setDraft({ name: row?.name ?? '', path: row?.path ?? '' })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingKey(null)
  }

  async function persist(rows: StorageRow[], successText: string) {
    const duplicated = rows.find(
      (row, idx) => rows.findIndex((it) => it.name.trim() === row.name.trim()) !== idx,
    )
    if (duplicated) {
      message.warning(`名字「${duplicated.name}」重复`)
      return false
    }
    setSaving(true)
    try {
      const res = await updateSystemConfigSection('storage', {
        items: rows.map((row) => ({ name: row.name.trim(), path: row.path.trim() })),
      })
      if (res.data) {
        applySection(res.data.storage)
        applyRemoteAppConfig(withClientBrand(res.data))
      } else {
        setItems(rows)
        setSelected([])
      }
      message.success(successText)
      return true
    } catch (e: unknown) {
      showCaughtError(e, '保存失败')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function submitDialog() {
    const values = await form.validateFields().catch(() => null)
    if (!values) return
    const name = values.name.trim()
    const path = values.path.trim()
    const next = items.map((item) => ({ ...item }))
    if (editingKey == null) {
      next.unshift(toRow({ name, path }))
    } else {
      const target = next.find((item) => item.key === editingKey)
      if (!target) return
      target.name = name
      target.path = path
    }
    const ok = await persist(next, editingKey == null ? '新增成功' : '修改成功')
    if (ok) closeDialog()
  }

  function confirmRemove(rows: StorageRow[]) {
    if (!rows.length) {
      message.warning('请先选择要删除的数据')
      return
    }
    const label = rows.length === 1 ? rows[0].name || '该条' : `选中的 ${rows.length} 条`
    XnModal.confirm({
      title: '提示',
      content: `确认删除${label}远程连接配置？删除后即时生效`,
      okType: 'danger',
      onOk: async () => {
        const keys = new Set(rows.map((row) => row.key))
        await persist(
          items.filter((item) => !keys.has(item.key)),
          '删除成功',
        )
      },
    })
  }

  function onButton(action: string) {
    if (action === 'add') {
      openDialog('add')
      return
    }
    if (action === 'edit' || action === 'view') {
      const row = selected[0]
      if (!row) {
        message.warning('请先选择一条数据')
        return
      }
      openDialog(action, row)
      return
    }
    if (action === 'delete') confirmRemove(selected)
  }

  const readonly = dialogMode === 'view'

  return (
    <>
      <XnPageLayout
        showPagination={false}
        loading={loading || saving}
        search={
          <>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message="可新增多条「名字 / 路径」，新增 / 编辑 / 删除即时落库。保存结果覆盖前端 appConfig.storage。推荐同源相对路径（minio → /minio/，kkFileView → /kkFileView/），由 Vite / Nginx 反代，勿写 127.0.0.1。云端为空时使用本地 app.ts 兜底。密钥勿写入前端。"
            />
            <XnSearch
              searchItem={resolvedSearchItems}
              onQueryForm={(query: SearchForm) => setKeyword(String(query.FuzzyWord ?? ''))}
              onReset={() => setKeyword('')}
            />
          </>
        }
        toolbar={
          <XnButton listItem={resolvedButtons} selected={selected} onButtonClick={onButton} />
        }
        table={
          <XnTable
            data={filteredItems}
            total={filteredItems.length}
            loading={loading || saving}
            showPagination={false}
            tableKey="system:remote-storage"
            entityName="远程连接"
            nameField="name"
            rowKey="key"
            columns={columns}
            actionItems={resolvedTableButtons}
            stripe
            onSelectionChange={(rows) => setSelected(rows as StorageRow[])}
            onRefresh={() => void loadData()}
            slots={{
              actions: ({ row }) => (
                <XnTableActions
                  items={resolvedTableButtons}
                  row={row}
                  onActionClick={({ action, row: r }) => {
                    const target = r as unknown as StorageRow
                    if (action === 'edit' || action === 'view') openDialog(action, target)
                    else if (action === 'delete') confirmRemove([target])
                  }}
                />
              ),
            }}
          />
        }
      />

      <XnModal
        title={DIALOG_TITLE[dialogMode]}
        open={dialogOpen}
        width={520}
        confirmLoading={saving}
        okText="确定"
        cancelText={readonly ? '关闭' : '取消'}
        okButtonProps={{ style: readonly ? { display: 'none' } : undefined }}
        cancelButtonProps={{ disabled: saving }}
        onOk={() => void submitDialog()}
        onCancel={closeDialog}
      >
        <Form form={form} labelCol={{ span: 5 }} disabled={readonly} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="名字" rules={[{ required: true, message: '请输入名字' }]}>
            <Input maxLength={64} placeholder="如 minio" />
          </Form.Item>
          <Form.Item name="path" label="路径" rules={[{ required: true, message: '请输入路径' }]}>
            <Input maxLength={1000} placeholder="如 /minio/" />
          </Form.Item>
        </Form>
      </XnModal>
    </>
  )
}
