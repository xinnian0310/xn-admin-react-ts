import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Tree, message, Modal } from 'antd'
import type { DataNode } from 'antd/es/tree'
import XnPageLayout from '@/components/XnPageLayout'
import XnTreePanel from '@/components/XnTreePanel'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import { usePageUi } from '@/hooks/usePageUi'
import {
  deleteModel,
  listModels,
  listProviders,
  probeProviderCredentials,
  testModel,
  updateModelStatus,
} from '@/api/ai/model'
import type { MineModel, ModelListData, ProviderCatalog, ProviderKeyCheck } from '@/types/ai/model'
import type { ButtonListItem } from '@/types/button'
import type { SearchForm, SearchItem } from '@/types/search'
import type { TableColumnItem } from '@/types/table'
import { isImageSrc } from '@/utils/icons'
import { showCaughtError } from '@/utils/request'
import ModelSave, { type ModelSaveHandle } from './save'
import ModelPick, { type ModelPickHandle } from './pick'
import './models.scss'

interface ProviderNode extends Record<string, unknown> {
  id: string
  name: string
  icon?: string
  keyConfigured: boolean
  lastCheckOk: boolean | null
}

const FALLBACK_SEARCH: SearchItem[] = [
  {
    label: '关键词',
    prop: 'keyword',
    type: 'input',
    placeholder: '模型名称 / 模型 ID',
    width: 220,
    clearable: true,
  },
]
const FALLBACK_BUTTONS: ButtonListItem[] = [
  { name: '新增', action: 'add', type: 'button', icon: 'PlusOutlined', typeColor: 'primary' },
]
const FALLBACK_TABLE_BUTTONS: ButtonListItem[] = [
  { name: '编辑', action: 'edit', type: 'button', typeColor: 'primary' },
  { name: '删除', action: 'delete', type: 'button', typeColor: 'danger' },
]

function providerDotClass(node: ProviderNode, probing: boolean) {
  if (probing) return 'is-checking'
  if (!node.keyConfigured) return 'is-none'
  if (node.lastCheckOk === true) return 'is-ok'
  if (node.lastCheckOk === false) return 'is-fail'
  return 'is-unknown'
}

function providerDotTitle(node: ProviderNode, probing: boolean) {
  if (probing) return '正在检测密钥'
  if (!node.keyConfigured) return '未配置密钥'
  if (node.lastCheckOk === true) return '密钥正常'
  if (node.lastCheckOk === false) return '密钥异常'
  return '已配置，未检测'
}

function connDotClass(ok: boolean | null | undefined) {
  if (ok === true) return 'is-ok'
  if (ok === false) return 'is-fail'
  return 'is-none'
}

function connText(ok: boolean | null | undefined) {
  if (ok === true) return '正常'
  if (ok === false) return '失败'
  return '未探测'
}

export default function AiModelsPage() {
  const {
    searchItems: remoteSearch,
    buttonItems: remoteButtons,
    tableButtonItems: remoteTableButtons,
  } = usePageUi('/ai/models')
  const saveRef = useRef<ModelSaveHandle>(null)
  const pickRef = useRef<ModelPickHandle>(null)
  const [loading, setLoading] = useState(false)
  const [probingIds, setProbingIds] = useState<string[]>([])
  const [probingModelIds, setProbingModelIds] = useState<string[]>([])
  const [currentKey, setCurrentKey] = useState('')
  const [providers, setProviders] = useState<ProviderCatalog[]>([])
  const [data, setData] = useState<ModelListData>({ trial: null, mine: [] })
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [selected, setSelected] = useState<MineModel[]>([])
  const probeSeqRef = useRef(0)
  const modelProbeSeqRef = useRef(0)
  const currentKeyRef = useRef('')
  const providersRef = useRef(providers)
  const dataRef = useRef(data)
  currentKeyRef.current = currentKey
  providersRef.current = providers
  dataRef.current = data

  const searchItems = remoteSearch.length ? remoteSearch : FALLBACK_SEARCH
  const buttonItems = remoteButtons.length ? remoteButtons : FALLBACK_BUTTONS
  const tableButtonItems = (
    remoteTableButtons.length ? remoteTableButtons : FALLBACK_TABLE_BUTTONS
  ).filter((item) => {
    if (item.action === 'add' || item.action === 'test') return false
    const name = String(item.name || '')
    return !name.includes('探测') && !name.includes('检测')
  })

  const columns: TableColumnItem[] = [
    { type: 'selection', width: 50, fixed: true },
    { type: 'slot', slot: 'icon', label: '图标', width: 72, align: 'center' },
    { type: 'slot', slot: 'name', label: '模型名称', minWidth: 200, showOverflowTooltip: true },
    { prop: 'modelId', label: '模型 ID', minWidth: 180, showOverflowTooltip: true },
    { type: 'slot', slot: 'conn', label: '连接状态', width: 120 },
    { type: 'switch', prop: 'status', label: '启用', width: 90, align: 'center' },
    { type: 'slot', slot: 'actions', label: '操作', width: 140, fixed: 'right' },
  ]

  const treeData = useMemo<ProviderNode[]>(
    () =>
      providers.map((p) => ({
        id: p.id,
        name: p.name,
        icon: p.icon,
        keyConfigured: !!p.keyConfigured,
        lastCheckOk: p.lastCheckOk ?? null,
      })),
    [providers],
  )

  const currentProvider = providers.find((p) => p.id === currentKey)
  const hasKey = !!currentProvider?.keyConfigured

  const emptyText = !providers.length
    ? '暂无厂商目录，请联系管理员添加'
    : !currentProvider
      ? '请选择厂商'
      : !hasKey
        ? '请先在「厂商目录」配置密钥后，再添加该厂商的模型'
        : '尚未添加模型，点击「新增」从该厂商选择'

  const tableData = useMemo(() => {
    const keyword = String(queryForm.keyword ?? '')
      .trim()
      .toLowerCase()
    return data.mine.filter((row) => {
      if (currentKey && row.providerId !== currentKey) return false
      if (!keyword) return true
      return [row.name, row.modelDisplayName, row.modelId]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(keyword))
    })
  }, [data.mine, currentKey, queryForm.keyword])

  const treeNodes: DataNode[] = treeData.map((node) => ({
    key: node.id,
    title: (
      <span className="provider-node">
        <i
          className={`status-dot ${providerDotClass(node, probingIds.includes(node.id))}`}
          title={providerDotTitle(node, probingIds.includes(node.id))}
        />
        {isImageSrc(node.icon) ? (
          <img src={node.icon} className="provider-logo" alt="" />
        ) : (
          <span className="provider-fallback">{node.name.slice(0, 1)}</span>
        )}
        <span className="provider-name">{node.name}</span>
      </span>
    ),
  }))

  function applyKeyChecks(checks: ProviderKeyCheck[]) {
    const map = Object.fromEntries(checks.map((item) => [item.id, item]))
    setProviders((prev) =>
      prev.map((provider) => {
        const check = map[provider.id]
        if (!check) return provider
        return {
          ...provider,
          keyConfigured: !!check.keyConfigured,
          keyMask: check.keyMask ?? provider.keyMask,
          lastCheckOk: check.lastCheckOk ?? null,
          lastCheckAt: check.lastCheckAt ?? null,
        }
      }),
    )
  }

  async function probeConfiguredKeys(list = providersRef.current) {
    const seq = ++probeSeqRef.current
    const ids = list.filter((p) => p.keyConfigured).map((p) => p.id)
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

  async function probeCurrentModels() {
    const seq = ++modelProbeSeqRef.current
    const providerId = currentKeyRef.current
    const provider = providersRef.current.find((p) => p.id === providerId)
    if (!providerId || !provider?.keyConfigured) {
      setProbingModelIds([])
      return
    }
    const rows = dataRef.current.mine.filter((row) => row.providerId === providerId)
    if (!rows.length) {
      setProbingModelIds([])
      return
    }
    setProbingModelIds(rows.map((row) => row.id))
    try {
      await Promise.all(
        rows.map(async (row) => {
          try {
            const res = await testModel(row.id, true)
            if (seq !== modelProbeSeqRef.current) return
            setData((prev) => ({
              ...prev,
              mine: prev.mine.map((item) =>
                item.id === row.id ? { ...item, lastCheckOk: !!res.data?.ok } : item,
              ),
            }))
          } catch {
            if (seq !== modelProbeSeqRef.current) return
            setData((prev) => ({
              ...prev,
              mine: prev.mine.map((item) =>
                item.id === row.id ? { ...item, lastCheckOk: false } : item,
              ),
            }))
          }
        }),
      )
    } finally {
      if (seq === modelProbeSeqRef.current) setProbingModelIds([])
    }
  }

  async function reload() {
    setLoading(true)
    try {
      const [modelRes, provRes] = await Promise.all([listModels(), listProviders()])
      setData(modelRes.data)
      dataRef.current = modelRes.data
      const list = provRes.data ?? []
      setProviders(list)
      providersRef.current = list
      setCurrentKey((prev) => {
        if (list.some((n) => n.id === prev)) return prev
        return list[0]?.id || ''
      })
    } finally {
      setLoading(false)
    }
    void probeConfiguredKeys(providersRef.current)
    void probeCurrentModels()
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setSelected([])
    void probeCurrentModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey])

  function buttonClick(action: string) {
    if (action === 'add') {
      if (!currentProvider) {
        message.warning('请选择厂商')
        return
      }
      if (!hasKey) {
        message.warning('请先在「厂商目录」配置密钥')
        return
      }
      void pickRef.current?.open(currentProvider)
      return
    }
    if (action === 'edit' && selected.length === 1) {
      void saveRef.current?.open('edit', selected[0].id)
      return
    }
    if (action === 'delete') onBatchDelete()
  }

  function onTableAction(payload: { action: string; row: Record<string, unknown> }) {
    const row = payload.row as unknown as MineModel
    if (payload.action === 'edit') void saveRef.current?.open('edit', row.id)
    else if (payload.action === 'delete') onDelete([row.id])
  }

  async function onSwitchChange(payload: {
    row: Record<string, unknown>
    prop: string
    value: unknown
  }) {
    if (payload.prop !== 'status') return
    const row = payload.row as unknown as MineModel
    const next = Number(payload.value)
    const prev = row.status
    try {
      await updateModelStatus(row.id, next)
      setData((cur) => ({
        ...cur,
        mine: cur.mine.map((item) => (item.id === row.id ? { ...item, status: next } : item)),
      }))
      message.success(next === 1 ? '已启用' : '已停用')
    } catch (e) {
      setData((cur) => ({
        ...cur,
        mine: cur.mine.map((item) => (item.id === row.id ? { ...item, status: prev } : item)),
      }))
      showCaughtError(e, '更新失败')
    }
  }

  function onDelete(ids: string[]) {
    Modal.confirm({
      title: '删除模型',
      content: '删除后历史会话仍可打开，但需要重新选择模型才能续聊。',
      okType: 'danger',
      onOk: async () => {
        await Promise.all(ids.map((id) => deleteModel(id)))
        message.success('已删除')
        await reload()
      },
    })
  }

  function onBatchDelete() {
    const ids = selected.map((row) => row.id)
    if (!ids.length) {
      message.warning('请选择要删除的模型')
      return
    }
    onDelete(ids)
  }

  return (
    <>
      <XnPageLayout
        showViewSwitch={false}
        loading={loading}
        aside={
          <XnTreePanel title="厂商目录" width={240} filterable={false}>
            <Tree
              treeData={treeNodes}
              selectedKeys={currentKey ? [currentKey] : []}
              defaultExpandAll
              onSelect={(keys) => {
                const id = keys[0] != null ? String(keys[0]) : ''
                if (id) setCurrentKey(id)
              }}
            />
          </XnTreePanel>
        }
        search={
          <>
            {data.available === false ? (
              <Alert
                className="models-tip"
                title={data.unavailableMessage || '暂无可用模型，请先添加我的模型'}
                type="info"
                showIcon
                closable={false}
              />
            ) : null}
            <XnSearch
              searchItem={searchItems}
              onQueryForm={setQueryForm}
              onReset={() => setQueryForm({})}
            />
          </>
        }
        toolbar={
          <XnButton listItem={buttonItems} selected={selected} onButtonClick={buttonClick} />
        }
        table={
          <XnTable
            data={tableData as unknown as Record<string, unknown>[]}
            total={tableData.length}
            loading={loading}
            showPagination={false}
            tableKey="ai:models"
            entityName="模型"
            nameField="name"
            rowKey="id"
            columns={columns}
            actionItems={tableButtonItems}
            emptyDescription={emptyText}
            stripe
            onSelectionChange={(rows) => setSelected(rows as MineModel[])}
            onSwitchChange={onSwitchChange}
            slots={{
              icon: () =>
                isImageSrc(currentProvider?.icon) ? (
                  <img src={currentProvider?.icon} className="table-logo" alt="" />
                ) : (
                  <span className="table-logo-fallback">
                    {(currentProvider?.name || '?').slice(0, 1)}
                  </span>
                ),
              name: ({ row }) => <>{String(row.name || row.modelDisplayName || '')}</>,
              conn: ({ row }) => (
                <span className="key-status">
                  <i
                    className={`status-dot ${
                      probingModelIds.includes(String(row.id))
                        ? 'is-checking'
                        : connDotClass(row.lastCheckOk as boolean | null)
                    }`}
                  />
                  <span>
                    {probingModelIds.includes(String(row.id))
                      ? '检测中'
                      : connText(row.lastCheckOk as boolean | null)}
                  </span>
                </span>
              ),
              actions: ({ row }) => (
                <XnTableActions items={tableButtonItems} row={row} onActionClick={onTableAction} />
              ),
            }}
          />
        }
      />
      <ModelSave ref={saveRef} onSuccess={() => void reload()} />
      <ModelPick ref={pickRef} onSuccess={() => void reload()} />
    </>
  )
}
