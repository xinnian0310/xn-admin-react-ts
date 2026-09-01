import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Cascader,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd'
import dayjs from 'dayjs'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import XnDialog from '@/components/XnDialog'
import {
  adminCreateSensitiveWord,
  adminDeleteQuotaOverride,
  adminDeleteSensitiveWord,
  adminExportUsage,
  adminGetQuotaSummary,
  adminGetSettings,
  adminGetTrial,
  adminListQuota,
  adminListSensitiveWords,
  adminResetQuota,
  adminTestTrial,
  adminUpdateQuota,
  adminUpdateSensitiveWord,
  adminUpdateSettings,
  adminUpdateTrial,
} from '@/api/ai/admin'
import { listModels, listProviders } from '@/api/ai/model'
import type {
  AdminQuotaRow,
  AdminQuotaSummary,
  AdminQuotaWrite,
  AdminSettings,
  AdminSensitiveWord,
  AdminTrial,
} from '@/types/ai/admin'
import type { MineModel, ProviderCatalog } from '@/types/ai/model'
import type { ButtonListItem } from '@/types/button'
import type { SearchForm, SearchItem } from '@/types/search'
import type { TableColumnItem } from '@/types/table'
import { groupModelsByProvider } from '@/utils/ai-model-cascader'
import { isImageSrc } from '@/utils/icons'
import './quota.scss'

const SEARCH_ITEMS: SearchItem[] = [
  {
    label: '用户',
    prop: 'keyword',
    type: 'input',
    placeholder: '用户名 / 昵称',
    width: 220,
    clearable: true,
  },
  {
    label: '覆盖',
    prop: 'onlyOverride',
    type: 'select',
    placeholder: '全部',
    width: 140,
    clearable: true,
    options: [
      { label: '全部', value: 0 },
      { label: '只看覆盖', value: 1 },
    ],
  },
]
const BUTTON_ITEMS: ButtonListItem[] = [
  {
    name: '导出 CSV',
    action: 'export',
    type: 'button',
    icon: 'DownloadOutlined',
    typeColor: 'primary',
  },
]
const TABLE_BUTTON_ITEMS: ButtonListItem[] = [
  { name: '覆盖配额', action: 'override', type: 'button', typeColor: 'primary' },
  { name: '停用试用', action: 'toggleTrial', type: 'button', typeColor: 'primary' },
  { name: '清零本月', action: 'reset', type: 'button', typeColor: 'primary' },
  { name: '取消覆盖', action: 'clearOverride', type: 'button', typeColor: 'danger' },
]
const COLUMNS: TableColumnItem[] = [
  { prop: 'username', label: '账号', width: 120, showOverflowTooltip: true },
  { prop: 'nickname', label: '昵称', width: 120, showOverflowTooltip: true },
  { prop: 'unitName', label: '单位', minWidth: 140, showOverflowTooltip: true },
  { type: 'slot', slot: 'usage', label: '本月已用 / 额度', width: 180 },
  { prop: 'requestCount', label: '请求', width: 80 },
  { type: 'slot', slot: 'tokens', label: 'Token', minWidth: 160 },
  { type: 'slot', slot: 'ratio', label: '估算占比', width: 100 },
  { prop: 'maxConcurrency', label: '并发', width: 70 },
  {
    prop: 'trialEnabled',
    label: '试用',
    type: 'tag',
    width: 80,
    tagSize: 'small',
    options: [
      { value: true, label: '开', type: 'success' },
      { value: false, label: '关', type: 'info' },
    ],
  },
  {
    prop: 'hasOverride',
    label: '覆盖',
    type: 'tag',
    width: 80,
    tagSize: 'small',
    options: [
      { value: true, label: '是', type: 'warning' },
      { value: false, label: '默认', type: 'info' },
    ],
  },
  { type: 'slot', slot: 'actions', label: '操作', width: 280, fixed: 'right' },
]

function formatMoney(value: number | null | undefined) {
  return Number(value || 0).toFixed(4)
}

function tableActionsFor(row: AdminQuotaRow): ButtonListItem[] {
  return [
    { name: '覆盖配额', action: 'override', type: 'button', typeColor: 'primary' },
    {
      name: row.trialEnabled ? '停用试用' : '恢复试用',
      action: 'toggleTrial',
      type: 'button',
      typeColor: 'primary',
    },
    { name: '清零本月', action: 'reset', type: 'button', typeColor: 'primary' },
    ...(row.hasOverride
      ? ([
          { name: '取消覆盖', action: 'clearOverride', type: 'button', typeColor: 'danger' },
        ] satisfies ButtonListItem[])
      : []),
  ]
}

export default function AiQuotaPage() {
  const [activeTab, setActiveTab] = useState('quota')
  const [mineModels, setMineModels] = useState<MineModel[]>([])
  const [providers, setProviders] = useState<ProviderCatalog[]>([])
  const [sourceModelId, setSourceModelId] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingExtra, setSavingExtra] = useState(false)
  const [testing, setTesting] = useState(false)
  const [trial, setTrial] = useState<AdminTrial>({
    enabled: true,
    name: '',
    sourceModelId: null,
    providerModelId: null,
    apiKey: null,
    defaultQuota: { monthlyAmount: 0.5, dailyAmount: null, currency: 'CNY', maxConcurrency: 2 },
  })
  const [settings, setSettings] = useState<AdminSettings>({
    trialEnabled: true,
    systemPrompt: '',
    quotaExceededTip: '本月试用额度已用完，请在「模型」中添加自己的模型继续使用',
    contentSafetyEnabled: false,
    maxMessageChars: 32000,
    maxMessagesPerConversation: 1000,
    maxConversationsPerUser: 500,
  })
  const [words, setWords] = useState<AdminSensitiveWord[]>([])
  const [rows, setRows] = useState<AdminQuotaRow[]>([])
  const [summary, setSummary] = useState<Partial<AdminQuotaSummary>>({})
  const [loading, setLoading] = useState(false)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [editVisible, setEditVisible] = useState(false)
  const [editUserId, setEditUserId] = useState('')
  const [editForm, setEditForm] = useState<AdminQuotaWrite>({
    monthlyAmount: 0.5,
    dailyAmount: null,
    maxConcurrency: 2,
  })
  const [wordOpen, setWordOpen] = useState(false)
  const [wordValue, setWordValue] = useState('')

  const keyedProviderIds = useMemo(
    () => new Set(providers.filter((p) => p.keyConfigured).map((p) => p.id)),
    [providers],
  )
  const shareableModels = useMemo(
    () =>
      mineModels.filter(
        (m) => m.status === 1 && (!m.providerId || keyedProviderIds.has(m.providerId)),
      ),
    [mineModels, keyedProviderIds],
  )
  const shareableCascader = useMemo(
    () =>
      groupModelsByProvider(shareableModels, { disableUnavailable: false }).map((group) => ({
        value: group.value,
        label: group.label,
        icon: group.icon,
        children: group.children.map((leaf) => ({
          value: leaf.value,
          label: leaf.label,
        })),
      })),
    [shareableModels],
  )
  const cascaderValue = useMemo(() => {
    if (!sourceModelId) return undefined
    for (const group of shareableCascader) {
      if (group.children.some((item) => item.value === sourceModelId)) {
        return [group.value, sourceModelId]
      }
    }
    return undefined
  }, [shareableCascader, sourceModelId])

  async function loadWords() {
    const res = await adminListSensitiveWords()
    setWords(res.data ?? [])
  }

  async function loadTrial() {
    const [modelRes, providerRes, trialRes, settingRes] = await Promise.all([
      listModels(),
      listProviders(),
      adminGetTrial(),
      adminGetSettings(),
      loadWords(),
    ])
    setMineModels(modelRes.data?.mine ?? [])
    setProviders(providerRes.data ?? [])
    const nextTrial = trialRes.data
    if (!nextTrial.defaultQuota) {
      nextTrial.defaultQuota = {
        monthlyAmount: 0.5,
        dailyAmount: null,
        currency: 'CNY',
        maxConcurrency: 2,
      }
    }
    setTrial(nextTrial)
    setSettings(settingRes.data)
    setSourceModelId(nextTrial.sourceModelId || '')
  }

  async function reload(nextPage = page, nextSize = size, nextQuery = queryForm) {
    setLoading(true)
    try {
      const keyword = String(nextQuery.keyword ?? '').trim()
      const onlyOverride = Number(nextQuery.onlyOverride) === 1
      const [res, summaryRes] = await Promise.all([
        adminListQuota({
          page: nextPage,
          size: nextSize,
          keyword: keyword || undefined,
          onlyOverride: onlyOverride || undefined,
        }),
        adminGetQuotaSummary(),
      ])
      setRows(res.data?.records ?? [])
      setTotal(Number(res.data?.total || 0))
      setSummary(summaryRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.all([loadTrial(), reload()])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSaveTrial() {
    if (trial.enabled && !sourceModelId) {
      message.warning('请选择要共享的模型')
      return
    }
    setSaving(true)
    try {
      await adminUpdateTrial({
        enabled: trial.enabled,
        sourceModelId: sourceModelId || undefined,
        defaultQuota: {
          monthlyAmount: trial.defaultQuota.monthlyAmount,
          dailyAmount: trial.defaultQuota.dailyAmount || null,
          maxConcurrency: trial.defaultQuota.maxConcurrency,
        },
      })
      await adminUpdateSettings({
        trialEnabled: trial.enabled,
        quotaExceededTip: settings.quotaExceededTip,
      })
      message.success('已保存')
      await loadTrial()
    } finally {
      setSaving(false)
    }
  }

  async function onSaveExtra() {
    setSavingExtra(true)
    try {
      await adminUpdateSettings({
        systemPrompt: settings.systemPrompt,
        contentSafetyEnabled: settings.contentSafetyEnabled,
        maxMessageChars: settings.maxMessageChars,
        maxMessagesPerConversation: settings.maxMessagesPerConversation,
        maxConversationsPerUser: settings.maxConversationsPerUser,
      })
      message.success('已保存')
    } finally {
      setSavingExtra(false)
    }
  }

  async function onTest() {
    setTesting(true)
    try {
      const res = await adminTestTrial()
      if (res.data?.ok) {
        message.success(`连通正常，耗时 ${res.data.latencyMs} ms`)
      } else {
        message.error(res.data?.message || '探测失败')
      }
    } finally {
      setTesting(false)
    }
  }

  async function onAddWord() {
    if (!wordValue.trim()) return
    await adminCreateSensitiveWord({ word: wordValue.trim(), action: 'BLOCK', status: 1 })
    message.success('已添加')
    setWordOpen(false)
    setWordValue('')
    await loadWords()
  }

  async function onToggleWord(row: AdminSensitiveWord) {
    await adminUpdateSensitiveWord(row.id, { word: row.word, status: row.status === 1 ? 0 : 1 })
    await loadWords()
  }

  function onDeleteWord(row: AdminSensitiveWord) {
    Modal.confirm({
      title: '删除敏感词',
      content: `删除「${row.word}」？`,
      okType: 'danger',
      onOk: async () => {
        await adminDeleteSensitiveWord(row.id)
        message.success('已删除')
        await loadWords()
      },
    })
  }

  function onTableAction(payload: { action: string; row: Record<string, unknown> }) {
    const row = payload.row as unknown as AdminQuotaRow
    if (payload.action === 'override') {
      setEditUserId(row.userId)
      setEditForm({
        monthlyAmount: Number(row.monthlyLimit),
        dailyAmount: row.dailyLimit == null ? null : Number(row.dailyLimit),
        maxConcurrency: row.maxConcurrency,
        trialEnabled: row.trialEnabled,
      })
      setEditVisible(true)
    } else if (payload.action === 'toggleTrial') {
      const next = !row.trialEnabled
      Modal.confirm({
        title: next ? '恢复试用' : '停用试用',
        content: next
          ? `恢复 ${row.username} 的平台试用？`
          : `停用后 ${row.username} 只能用自己的模型。`,
        onOk: async () => {
          await adminUpdateQuota(row.userId, {
            monthlyAmount: row.monthlyLimit,
            dailyAmount: row.dailyLimit,
            maxConcurrency: row.maxConcurrency,
            trialEnabled: next,
          })
          message.success(next ? '已恢复' : '已停用')
          await reload()
        },
      })
    } else if (payload.action === 'reset') {
      Modal.confirm({
        title: '清零本月',
        content: `将清零 ${row.username} 本月试用计数，流水仍保留。`,
        onOk: async () => {
          await adminResetQuota(row.userId)
          message.success('已清零')
          await reload()
        },
      })
    } else if (payload.action === 'clearOverride') {
      Modal.confirm({
        title: '取消覆盖',
        content: '取消后回落到「配额」里的全局默认额度。',
        onOk: async () => {
          await adminDeleteQuotaOverride(row.userId)
          message.success('已取消覆盖')
          await reload()
        },
      })
    }
  }

  async function saveEdit() {
    const monthly = Number(editForm.monthlyAmount)
    if (!(monthly > 0)) {
      message.warning('月额度必须大于 0')
      return
    }
    await adminUpdateQuota(editUserId, {
      monthlyAmount: monthly,
      dailyAmount: editForm.dailyAmount ? Number(editForm.dailyAmount) : null,
      maxConcurrency: editForm.maxConcurrency,
      trialEnabled: editForm.trialEnabled,
    })
    setEditVisible(false)
    message.success('已覆盖该用户配额')
    await reload()
  }

  const tabItems = [
    {
      key: 'quota',
      label: '配额',
      children: (
        <>
          <p className="lead">
            SuperAdmin
            把自己已添加、且已配置密钥的模型共享给其他角色试用。对话下拉里显示为「模型名（试用）」，调用走你的
            API Key。下面是全局默认额度，未单独配置的用户都走这里。
          </p>
          <Form labelCol={{ span: 5 }} className="trial-form">
            <Form.Item label="启用试用">
              <Switch
                checked={trial.enabled}
                onChange={(enabled) => setTrial((prev) => ({ ...prev, enabled }))}
              />
            </Form.Item>
            <Form.Item label="共享模型" required>
              <Cascader
                value={cascaderValue}
                options={shareableCascader}
                disabled={!trial.enabled}
                showSearch
                allowClear
                expandTrigger="hover"
                placeholder="先选厂商，再选模型"
                style={{ width: 360 }}
                displayRender={(labels) => labels[labels.length - 1]}
                optionRender={(option) => {
                  const data = option as typeof option & { icon?: string }
                  return (
                    <span className="cascader-opt">
                      {isImageSrc(data.icon) ? (
                        <img src={data.icon} className="cascader-logo" alt="" />
                      ) : null}
                      <span>{String(option.label ?? '')}</span>
                    </span>
                  )
                }}
                onChange={(value) => {
                  setSourceModelId(
                    Array.isArray(value) && value.length ? String(value[value.length - 1]) : '',
                  )
                }}
              />
              <div className="hint">
                没有可选模型时，请先在「厂商目录」配置密钥，再在「模型」中添加。
              </div>
            </Form.Item>
            <Form.Item label="每用户每月">
              <InputNumber
                min={0.01}
                step={0.1}
                precision={4}
                value={trial.defaultQuota.monthlyAmount}
                onChange={(v) =>
                  setTrial((prev) => ({
                    ...prev,
                    defaultQuota: { ...prev.defaultQuota, monthlyAmount: Number(v || 0) },
                  }))
                }
              />
              <span className="hint inline">元，可在「用户额度」单独覆盖</span>
            </Form.Item>
            <Form.Item label="每用户每日">
              <InputNumber
                min={0}
                step={0.1}
                precision={4}
                value={trial.defaultQuota.dailyAmount ?? undefined}
                onChange={(v) =>
                  setTrial((prev) => ({
                    ...prev,
                    defaultQuota: {
                      ...prev.defaultQuota,
                      dailyAmount: v == null ? null : Number(v),
                    },
                  }))
                }
              />
              <span className="hint inline">留空或不填表示不限</span>
            </Form.Item>
            <Form.Item label="每用户并发">
              <InputNumber
                min={1}
                max={20}
                value={trial.defaultQuota.maxConcurrency}
                onChange={(v) =>
                  setTrial((prev) => ({
                    ...prev,
                    defaultQuota: { ...prev.defaultQuota, maxConcurrency: Number(v || 1) },
                  }))
                }
              />
            </Form.Item>
            <Form.Item label="超额提示">
              <Input
                maxLength={255}
                style={{ maxWidth: 520 }}
                value={settings.quotaExceededTip}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, quotaExceededTip: e.target.value }))
                }
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" loading={saving} onClick={() => void onSaveTrial()}>
                保存试用设置
              </Button>
              <Button
                style={{ marginLeft: 8 }}
                loading={testing}
                disabled={!sourceModelId}
                onClick={() => void onTest()}
              >
                探测连通性
              </Button>
            </Form.Item>
          </Form>
        </>
      ),
    },
    {
      key: 'users',
      label: '用户额度',
      children: (
        <div className="quota-users">
          <p className="lead">
            为单个用户单独配置月额、日额、并发和试用开关，会覆盖「配额」里的默认值。取消覆盖后回落到全局默认。
          </p>
          <div className="overview">
            <Statistic
              title="本月试用总花费"
              value={Number(summary.totalCost || 0)}
              precision={4}
              suffix="元"
            />
            <Statistic title="产生费用人数" value={summary.userCount || 0} suffix="人" />
            <Statistic title="试用请求数" value={summary.requestCount || 0} />
            <Statistic
              title="估算占比"
              value={Math.round((summary.estimatedRatio || 0) * 100)}
              suffix="%"
            />
          </div>
          <XnPageLayout
            showViewSwitch={false}
            loading={loading}
            page={page}
            pageSize={size}
            total={total}
            search={
              <XnSearch
                searchItem={SEARCH_ITEMS}
                onQueryForm={(form) => {
                  setQueryForm(form)
                  setPage(1)
                  void reload(1, size, form)
                }}
                onReset={(form) => {
                  setQueryForm(form)
                  setPage(1)
                  void reload(1, size, form)
                }}
              />
            }
            toolbar={
              <XnButton
                listItem={BUTTON_ITEMS}
                onButtonClick={(action) => {
                  if (action === 'export') void adminExportUsage(month)
                }}
              />
            }
            toolbarExtra={
              <DatePicker
                picker="month"
                value={month ? dayjs(month, 'YYYY-MM') : null}
                onChange={(_d, text) => setMonth(Array.isArray(text) ? text[0] : text)}
                placeholder="导出月份"
                style={{ width: 140 }}
              />
            }
            table={
              <XnTable
                data={rows as unknown as Record<string, unknown>[]}
                total={total}
                loading={loading}
                page={page}
                pageSize={size}
                tableKey="ai:quota-users"
                entityName="用户"
                nameField="username"
                rowKey="userId"
                columns={COLUMNS}
                actionItems={TABLE_BUTTON_ITEMS}
                onPageChange={(p, s) => {
                  setPage(p)
                  setSize(s)
                  void reload(p, s)
                }}
                onRefresh={() => void reload()}
                slots={{
                  usage: ({ row }) => (
                    <>
                      {formatMoney(row.monthlyUsed as number)} /{' '}
                      {formatMoney(row.monthlyLimit as number)} 元
                    </>
                  ),
                  tokens: ({ row }) => (
                    <>
                      入 {String(row.promptTokens)} / 出 {String(row.completionTokens)}
                    </>
                  ),
                  ratio: ({ row }) => <>{Math.round((Number(row.estimatedRatio) || 0) * 100)}%</>,
                  actions: ({ row }) => (
                    <XnTableActions
                      items={tableActionsFor(row as unknown as AdminQuotaRow)}
                      row={row}
                      onActionClick={onTableAction}
                    />
                  ),
                }}
              />
            }
          />
        </div>
      ),
    },
    {
      key: 'safety',
      label: '限额与安全',
      children: (
        <>
          <Form labelCol={{ span: 5 }} style={{ maxWidth: 720 }}>
            <Form.Item label="系统提示词">
              <Input.TextArea
                rows={3}
                placeholder="仅作用于试用通道，可留空"
                value={settings.systemPrompt || ''}
                onChange={(e) => setSettings((prev) => ({ ...prev, systemPrompt: e.target.value }))}
              />
            </Form.Item>
            <Form.Item label="内容安全">
              <Switch
                checked={settings.contentSafetyEnabled}
                onChange={(contentSafetyEnabled) =>
                  setSettings((prev) => ({ ...prev, contentSafetyEnabled }))
                }
              />
              <span className="hint inline">打开后才会检测敏感词</span>
            </Form.Item>
            <Form.Item label="单条消息上限">
              <InputNumber
                min={100}
                max={32000}
                value={settings.maxMessageChars}
                onChange={(v) =>
                  setSettings((prev) => ({ ...prev, maxMessageChars: Number(v || 100) }))
                }
              />
              <span className="hint inline">字</span>
            </Form.Item>
            <Form.Item label="单会话消息数">
              <InputNumber
                min={10}
                max={5000}
                value={settings.maxMessagesPerConversation}
                onChange={(v) =>
                  setSettings((prev) => ({ ...prev, maxMessagesPerConversation: Number(v || 10) }))
                }
              />
            </Form.Item>
            <Form.Item label="每人会话数">
              <InputNumber
                min={10}
                max={2000}
                value={settings.maxConversationsPerUser}
                onChange={(v) =>
                  setSettings((prev) => ({ ...prev, maxConversationsPerUser: Number(v || 10) }))
                }
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" loading={savingExtra} onClick={() => void onSaveExtra()}>
                保存限额
              </Button>
            </Form.Item>
          </Form>
          <div className="words">
            <div className="page-header">
              <h4 className="page-title">敏感词</h4>
              <Button
                type="primary"
                onClick={() => {
                  setWordValue('')
                  setWordOpen(true)
                }}
              >
                新增
              </Button>
            </div>
            <Table
              rowKey="id"
              dataSource={words}
              bordered
              pagination={false}
              columns={[
                { title: '词', dataIndex: 'word', minWidth: 160 },
                { title: '分类', dataIndex: 'category', width: 120 },
                { title: '动作', dataIndex: 'action', width: 100 },
                {
                  title: '状态',
                  width: 90,
                  render: (_v, row) => (
                    <Tag color={row.status === 1 ? 'success' : 'default'}>
                      {row.status === 1 ? '启用' : '停用'}
                    </Tag>
                  ),
                },
                {
                  title: '操作',
                  width: 160,
                  render: (_v, row) => (
                    <>
                      <Button type="link" onClick={() => void onToggleWord(row)}>
                        {row.status === 1 ? '停用' : '启用'}
                      </Button>
                      <Button type="link" danger onClick={() => onDeleteWord(row)}>
                        删除
                      </Button>
                    </>
                  ),
                },
              ]}
            />
          </div>
        </>
      ),
    },
  ]

  return (
    <div className="page-card quota-page">
      <div className="page-header">
        <h2 className="page-title">配额</h2>
      </div>
      <Tabs
        className="quota-page__tabs"
        tabPlacement="start"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
      <XnDialog
        title="覆盖该用户的配额"
        open={editVisible}
        width={420}
        destroyOnClose
        onCancel={() => setEditVisible(false)}
        onConfirm={() => void saveEdit()}
        confirmText="保存"
      >
        <p className="lead">保存后仅对该用户生效，覆盖「配额」中的月额、日额和并发。</p>
        <Form labelCol={{ span: 6 }}>
          <Form.Item label="每月额度">
            <InputNumber
              min={0.0001}
              precision={4}
              step={0.1}
              value={editForm.monthlyAmount}
              onChange={(v) => setEditForm((prev) => ({ ...prev, monthlyAmount: Number(v || 0) }))}
            />
          </Form.Item>
          <Form.Item label="每日额度">
            <InputNumber
              min={0}
              precision={4}
              step={0.1}
              placeholder="空=不限"
              value={editForm.dailyAmount ?? undefined}
              onChange={(v) =>
                setEditForm((prev) => ({ ...prev, dailyAmount: v == null ? null : Number(v) }))
              }
            />
          </Form.Item>
          <Form.Item label="最大并发">
            <InputNumber
              min={1}
              max={20}
              value={editForm.maxConcurrency}
              onChange={(v) => setEditForm((prev) => ({ ...prev, maxConcurrency: Number(v || 1) }))}
            />
          </Form.Item>
        </Form>
      </XnDialog>
      <XnDialog
        title="新增敏感词"
        open={wordOpen}
        width={420}
        destroyOnClose
        onCancel={() => setWordOpen(false)}
        onConfirm={() => void onAddWord()}
        confirmText="添加"
      >
        <Input
          placeholder="输入要拦截的词"
          value={wordValue}
          onChange={(e) => setWordValue(e.target.value)}
          onPressEnter={() => void onAddWord()}
        />
      </XnDialog>
    </div>
  )
}
