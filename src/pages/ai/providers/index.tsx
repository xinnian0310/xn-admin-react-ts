import { useEffect, useMemo, useRef, useState } from 'react'
import { message, Modal } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import { usePageUi } from '@/hooks/usePageUi'
import { usePermission } from '@/hooks/usePermission'
import { adminDeleteProvider, adminDisableProvider, adminPageProviders } from '@/api/ai/admin'
import { pageProviders, probeProviderCredentials } from '@/api/ai/model'
import type { AdminProvider } from '@/types/ai/admin'
import type { ProviderCatalog, ProviderKeyCheck } from '@/types/ai/model'
import type { ButtonListItem } from '@/types/button'
import type { SaveMode } from '@/types/save'
import type { SearchForm, SearchItem } from '@/types/search'
import type { TableColumnItem } from '@/types/table'
import { isImageSrc } from '@/utils/icons'
import ProviderSave, { type ProviderSaveHandle } from './save'
import ProviderKeySave, { type ProviderKeySaveHandle } from './key-save'
import './providers.scss'

const FALLBACK_SEARCH: SearchItem[] = [
  {
    label: '名称',
    prop: 'name',
    type: 'input',
    placeholder: '厂商名称',
    width: 200,
    clearable: true,
  },
  {
    label: '标识',
    prop: 'code',
    type: 'input',
    placeholder: '如 deepseek',
    width: 160,
    clearable: true,
  },
  {
    label: '状态',
    prop: 'status',
    type: 'select',
    placeholder: '全部',
    width: 140,
    clearable: true,
    options: [
      { label: '启用', value: 1 },
      { label: '停用', value: 0 },
    ],
  },
]
const FALLBACK_ADMIN_BUTTONS: ButtonListItem[] = [
  { name: '新增', action: 'add', type: 'button', icon: 'PlusOutlined', typeColor: 'primary' },
  {
    name: '查看',
    action: 'view',
    type: 'button',
    icon: 'EyeOutlined',
    typeColor: 'primary',
    index: 0,
  },
  {
    name: '编辑',
    action: 'edit',
    type: 'button',
    icon: 'EditOutlined',
    typeColor: 'primary',
    index: 0,
  },
  {
    name: '配置密钥',
    action: 'credential',
    type: 'button',
    icon: 'KeyOutlined',
    typeColor: 'primary',
    index: 0,
  },
  { name: '删除', action: 'delete', type: 'button', icon: 'DeleteOutlined', typeColor: 'danger' },
]
const FALLBACK_USER_BUTTONS: ButtonListItem[] = [
  {
    name: '配置密钥',
    action: 'credential',
    type: 'button',
    icon: 'KeyOutlined',
    typeColor: 'primary',
    index: 0,
  },
]
const FALLBACK_ADMIN_TABLE: ButtonListItem[] = [
  { name: '查看', action: 'view', type: 'button', typeColor: 'primary' },
  { name: '编辑', action: 'edit', type: 'button', typeColor: 'primary' },
  { name: '配置密钥', action: 'credential', type: 'button', typeColor: 'primary' },
  { name: '停用', action: 'disable', type: 'button', typeColor: 'danger' },
  { name: '删除', action: 'delete', type: 'button', typeColor: 'danger' },
]
const FALLBACK_USER_TABLE: ButtonListItem[] = [
  { name: '配置密钥', action: 'credential', type: 'button', typeColor: 'primary' },
]

function mergeByAction(remote: ButtonListItem[], fallback: ButtonListItem[]) {
  if (!remote.length) return fallback
  const actions = new Set(remote.map((item) => item.action))
  const missing = fallback.filter((item) => item.action && !actions.has(item.action))
  if (!missing.length) return remote
  const order = fallback.map((item) => item.action)
  return [...remote, ...missing].sort((a, b) => order.indexOf(a.action) - order.indexOf(b.action))
}

function fromCatalog(list: ProviderCatalog[]): AdminProvider[] {
  return list.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    baseUrl: p.baseUrl || '',
    docUrl: p.docUrl,
    keyHint: p.keyHint,
    icon: p.icon,
    status: 1,
    sort: 0,
    models: [],
    keyConfigured: !!p.keyConfigured,
    keyMask: p.keyMask ?? null,
    lastCheckOk: p.lastCheckOk ?? null,
    lastCheckAt: p.lastCheckAt ?? null,
  }))
}

function keyDotClass(row: AdminProvider, probing: boolean) {
  if (probing) return 'is-checking'
  if (!row.keyConfigured) return 'is-none'
  if (row.lastCheckOk === true) return 'is-ok'
  if (row.lastCheckOk === false) return 'is-fail'
  return 'is-unknown'
}

function keyStatusText(row: AdminProvider, probing: boolean) {
  if (probing) return '检测中'
  if (!row.keyConfigured) return '未配置'
  if (row.lastCheckOk === true) return '正常'
  if (row.lastCheckOk === false) return '异常'
  return '未检测'
}

export default function AiProvidersPage() {
  const { isSuperAdmin } = usePermission()
  const superAdmin = isSuperAdmin()
  const {
    searchItems: remoteSearch,
    buttonItems: remoteButtons,
    tableButtonItems: remoteTableButtons,
  } = usePageUi('/ai/providers')
  const saveRef = useRef<ProviderSaveHandle>(null)
  const keyRef = useRef<ProviderKeySaveHandle>(null)
  const [loading, setLoading] = useState(false)
  const [probingIds, setProbingIds] = useState<string[]>([])
  const [tableData, setTableData] = useState<AdminProvider[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [selected, setSelected] = useState<AdminProvider[]>([])
  const probeSeqRef = useRef(0)
  const tableDataRef = useRef(tableData)
  tableDataRef.current = tableData

  const searchItems = useMemo(() => {
    const items = remoteSearch.length ? remoteSearch : FALLBACK_SEARCH
    if (superAdmin) return items
    return items.filter((item) => item.prop !== 'status')
  }, [remoteSearch, superAdmin])

  const buttonItems = useMemo(
    () =>
      mergeByAction(remoteButtons, superAdmin ? FALLBACK_ADMIN_BUTTONS : FALLBACK_USER_BUTTONS).map(
        (item) => (item.action === 'add' ? { ...item, name: '新增' } : item),
      ),
    [remoteButtons, superAdmin],
  )

  const tableButtonItems = useMemo(
    () =>
      mergeByAction(remoteTableButtons, superAdmin ? FALLBACK_ADMIN_TABLE : FALLBACK_USER_TABLE),
    [remoteTableButtons, superAdmin],
  )

  const columns = useMemo<TableColumnItem[]>(() => {
    const cols: TableColumnItem[] = [
      { type: 'selection', width: 50, fixed: true },
      { type: 'slot', slot: 'icon', label: '图标', width: 72, align: 'center' },
      { prop: 'name', label: '厂商', minWidth: 140 },
      { type: 'slot', slot: 'keyMask', label: '我的密钥', width: 160 },
      { prop: 'baseUrl', label: 'Base URL', minWidth: 220, showOverflowTooltip: true },
      { type: 'slot', slot: 'keyStatus', label: '密钥状态', width: 110 },
    ]
    if (superAdmin) {
      cols.push({
        prop: 'status',
        label: '状态',
        width: 90,
        type: 'tag',
        options: [
          { value: 1, label: '启用', type: 'success' },
          { value: 0, label: '停用', type: 'info' },
        ],
      })
    }
    cols.push({
      type: 'slot',
      slot: 'actions',
      label: '操作',
      width: superAdmin ? 280 : 120,
      fixed: 'right',
    })
    return cols
  }, [superAdmin])

  function applyKeyChecks(checks: ProviderKeyCheck[]) {
    const map = Object.fromEntries(checks.map((item) => [item.id, item]))
    setTableData((prev) =>
      prev.map((row) => {
        const check = map[row.id]
        if (!check) return row
        return {
          ...row,
          keyConfigured: !!check.keyConfigured,
          keyMask: check.keyMask ?? row.keyMask,
          lastCheckOk: check.lastCheckOk ?? null,
          lastCheckAt: check.lastCheckAt ?? null,
        }
      }),
    )
  }

  async function probeConfiguredKeys(list = tableDataRef.current) {
    const seq = ++probeSeqRef.current
    const ids = list.filter((row) => row.keyConfigured).map((row) => row.id)
    if (!ids.length) {
      setProbingIds([])
      return
    }
    setProbingIds(ids)
    try {
      const checks = await probeProviderCredentials(ids)
      if (seq !== probeSeqRef.current) return
      applyKeyChecks(checks)
    } catch {
      /* 保留上次状态 */
    } finally {
      if (seq === probeSeqRef.current) setProbingIds([])
    }
  }

  async function loadData(nextPage = page, nextSize = size, nextQuery = queryForm) {
    setLoading(true)
    try {
      const params: {
        page: number
        size: number
        name?: string
        code?: string
        status?: number
      } = { page: nextPage, size: nextSize }
      const name = String(nextQuery.name ?? '').trim()
      const code = String(nextQuery.code ?? '').trim()
      if (name) params.name = name
      if (code) params.code = code
      const status = nextQuery.status
      if (superAdmin && status !== undefined && status !== null && status !== '') {
        params.status = Number(status)
      }
      if (superAdmin) {
        const res = await adminPageProviders(params)
        const records = res.data?.records ?? []
        setTableData(records)
        tableDataRef.current = records
        setTotal(res.data?.total ?? 0)
      } else {
        const res = await pageProviders(params)
        const records = fromCatalog(res.data?.records ?? [])
        setTableData(records)
        tableDataRef.current = records
        setTotal(res.data?.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
    void probeConfiguredKeys()
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function ensureSingleSelected() {
    if (selected.length !== 1) {
      message.warning('请选择一项操作')
      return null
    }
    return selected[0]
  }

  function buttonClick(action: string) {
    if (action === 'add') {
      void saveRef.current?.open('add')
      return
    }
    if (action === 'view' || action === 'edit') {
      const row = ensureSingleSelected()
      if (!row) return
      void saveRef.current?.open(action as SaveMode, row.id)
      return
    }
    if (action === 'credential') {
      const row = ensureSingleSelected()
      if (!row) return
      keyRef.current?.open(row)
      return
    }
    if (action === 'delete') handleBatchDelete()
  }

  function tableActionsFor(_row: AdminProvider) {
    if (superAdmin) return tableButtonItems
    return tableButtonItems.filter((item) => item.action === 'credential')
  }

  function tableActionDisabled(action: string, row: Record<string, unknown>) {
    if (action === 'disable' && row.status !== 1) return '已停用'
    return false
  }

  function onTableAction(payload: { action: string; row: Record<string, unknown> }) {
    const row = payload.row as unknown as AdminProvider
    if (payload.action === 'view') void saveRef.current?.open('view', row.id)
    else if (payload.action === 'edit') void saveRef.current?.open('edit', row.id)
    else if (payload.action === 'credential') keyRef.current?.open(row)
    else if (payload.action === 'disable') onDisable(row)
    else if (payload.action === 'delete') onDelete(row)
  }

  function onDisable(row: AdminProvider) {
    Modal.confirm({
      title: '停用厂商',
      content: `停用后员工不能再新建绑定，已绑定的模型仍可继续用。确定停用「${row.name}」？`,
      onOk: async () => {
        await adminDisableProvider(row.id)
        message.success('已停用')
        await loadData()
      },
    })
  }

  function onDelete(row: AdminProvider) {
    Modal.confirm({
      title: '删除厂商',
      content: `删除后目录及目录模型将移除，无法恢复。若仍有员工模型或试用通道绑定「${row.name}」，将无法删除。`,
      okText: '删除',
      okType: 'danger',
      onOk: async () => {
        await adminDeleteProvider(row.id)
        message.success('已删除')
        await loadData()
      },
    })
  }

  function handleBatchDelete() {
    if (!selected.length) {
      message.warning('请至少选择一项')
      return
    }
    const count = selected.length
    const names = selected.map((row) => `「${row.name}」`).join('、')
    Modal.confirm({
      title: '删除厂商',
      content: `删除后目录及目录模型将移除，无法恢复。若仍有员工模型或试用通道绑定，将无法删除。确定删除选中的 ${count} 个厂商：${names}？`,
      okText: '删除',
      okType: 'danger',
      onOk: async () => {
        for (const row of selected) {
          await adminDeleteProvider(row.id)
        }
        message.success('已删除')
        setSelected([])
        await loadData()
      },
    })
  }

  return (
    <>
      <XnPageLayout
        showViewSwitch={false}
        page={page}
        pageSize={size}
        total={total}
        loading={loading}
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
        toolbar={
          <XnButton listItem={buttonItems} selected={selected} onButtonClick={buttonClick} />
        }
        table={
          <XnTable
            data={tableData as unknown as Record<string, unknown>[]}
            total={total}
            loading={loading}
            page={page}
            pageSize={size}
            tableKey="ai:providers"
            entityName="厂商"
            nameField="name"
            rowKey="id"
            columns={columns}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as AdminProvider[])}
            onPageChange={(p, s) => {
              setPage(p)
              setSize(s)
              void loadData(p, s)
            }}
            onRefresh={() => void loadData()}
            slots={{
              icon: ({ row }) =>
                isImageSrc(row.icon as string) ? (
                  <img src={String(row.icon)} className="provider-logo" alt="" />
                ) : (
                  <span className="provider-logo-fallback">
                    {String(row.name || '?').slice(0, 1)}
                  </span>
                ),
              keyMask: ({ row }) => <>{String(row.keyMask || '未配置')}</>,
              keyStatus: ({ row }) => {
                const item = row as unknown as AdminProvider
                return (
                  <span className="key-status">
                    <i
                      className={`status-dot ${keyDotClass(item, probingIds.includes(item.id))}`}
                    />
                    <span>{keyStatusText(item, probingIds.includes(item.id))}</span>
                  </span>
                )
              },
              actions: ({ row }) => (
                <XnTableActions
                  items={tableActionsFor(row as unknown as AdminProvider)}
                  row={row}
                  disabled={tableActionDisabled}
                  onActionClick={onTableAction}
                />
              ),
            }}
          />
        }
      />
      <ProviderSave ref={saveRef} onSuccess={() => void loadData()} />
      <ProviderKeySave ref={keyRef} onSuccess={() => void loadData()} />
    </>
  )
}
