import { useEffect, useState } from 'react'
import { Form, InputNumber, Modal, Switch, message } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import XnTreePanel from '@/components/XnTreePanel'
import { usePageUi } from '@/hooks/usePageUi'
import {
  getSecurityPolicy,
  listLockedAccounts,
  unlockAccount,
  updateSecurityPolicy,
  type LockedAccount,
  type SecurityPolicy,
} from '@/api/security-policy'
import type { TableColumnItem } from '@/types/table'

const defaultForm: SecurityPolicy = {
  maxFailures: 5,
  lockMinutes: 15,
  rateLimitPerMinute: 30,
  captchaTtlSeconds: 120,
  pwdMinLength: 6,
  pwdMaxLength: 50,
  pwdRequireUpper: false,
  pwdRequireLower: false,
  pwdRequireDigit: false,
  pwdRequireSpecial: false,
  pwdExpireDays: 0,
  pwdForceChangeFirst: true,
  pwdHistoryCount: 0,
  updatedAt: '',
}

function formatRemain(sec: number) {
  if (sec >= 60) return `${Math.ceil(sec / 60)} 分钟`
  return `${sec} 秒`
}

export default function SecurityPage() {
  const { buttonItems, tableButtonItems } = usePageUi('/system/security')
  const [loading, setLoading] = useState(false)
  const [unlocking, setUnlocking] = useState('')
  const [form, setForm] = useState<SecurityPolicy>({ ...defaultForm })
  const [allData, setAllData] = useState<LockedAccount[]>([])
  const [tableData, setTableData] = useState<LockedAccount[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [selected, setSelected] = useState<LockedAccount[]>([])

  const columns: TableColumnItem[] = [
    { prop: 'username', label: '用户名', minWidth: 160 },
    { type: 'slot', slot: 'remainSeconds', prop: 'remainSeconds', label: '剩余时间', width: 120 },
    { type: 'slot', slot: 'actions', label: '操作', width: 100, fixed: 'right' },
  ]

  function applyLocalPage(nextPage = page, nextSize = size, source = allData) {
    setTotal(source.length)
    const start = (nextPage - 1) * nextSize
    setTableData(source.slice(start, start + nextSize))
  }

  async function loadPolicy() {
    const res = await getSecurityPolicy()
    const data = res.data
    setForm({
      maxFailures: data.maxFailures,
      lockMinutes: data.lockMinutes,
      rateLimitPerMinute: data.rateLimitPerMinute,
      captchaTtlSeconds: data.captchaTtlSeconds,
      pwdMinLength: data.pwdMinLength ?? 6,
      pwdMaxLength: data.pwdMaxLength ?? 50,
      pwdRequireUpper: !!data.pwdRequireUpper,
      pwdRequireLower: !!data.pwdRequireLower,
      pwdRequireDigit: !!data.pwdRequireDigit,
      pwdRequireSpecial: !!data.pwdRequireSpecial,
      pwdExpireDays: data.pwdExpireDays ?? 0,
      pwdForceChangeFirst: data.pwdForceChangeFirst !== false,
      pwdHistoryCount: data.pwdHistoryCount ?? 0,
      updatedAt: data.updatedAt || '',
    })
  }

  async function loadLocks() {
    const res = await listLockedAccounts()
    const rows = res.data || []
    setAllData(rows)
    applyLocalPage(page, size, rows)
  }

  async function loadData() {
    setLoading(true)
    try {
      await Promise.all([loadPolicy(), loadLocks()])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    if (form.pwdMaxLength < form.pwdMinLength) {
      message.warning('密码最大长度不能小于最小长度')
      return
    }
    const res = await updateSecurityPolicy({
      maxFailures: form.maxFailures,
      lockMinutes: form.lockMinutes,
      rateLimitPerMinute: form.rateLimitPerMinute,
      captchaTtlSeconds: form.captchaTtlSeconds,
      pwdMinLength: form.pwdMinLength,
      pwdMaxLength: form.pwdMaxLength,
      pwdRequireUpper: form.pwdRequireUpper,
      pwdRequireLower: form.pwdRequireLower,
      pwdRequireDigit: form.pwdRequireDigit,
      pwdRequireSpecial: form.pwdRequireSpecial,
      pwdExpireDays: form.pwdExpireDays,
      pwdForceChangeFirst: form.pwdForceChangeFirst,
      pwdHistoryCount: form.pwdHistoryCount,
    })
    setForm((prev) => ({ ...prev, updatedAt: res.data.updatedAt || prev.updatedAt }))
    message.success('保存成功，已立即生效')
  }

  async function buttonClick(action: string) {
    if (action === 'refresh' || action === 'view') await loadData()
    else if (action === 'edit' || action === 'update' || action === 'save') await handleSave()
  }

  async function handleUnlock(username: string) {
    if (!username) return
    Modal.confirm({
      title: '解锁确认',
      content: `确定解锁账号「${username}」？`,
      onOk: async () => {
        setUnlocking(username)
        try {
          await unlockAccount(username)
          message.success('已解锁')
          await loadLocks()
        } finally {
          setUnlocking('')
        }
      },
    })
  }

  function patch<K extends keyof SecurityPolicy>(key: K, value: SecurityPolicy[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const hint = { marginLeft: 8, color: '#94a3b8', fontSize: 12 }

  return (
    <XnPageLayout
      showViewSwitch={false}
      page={page}
      pageSize={size}
      total={total}

      onPageChange={(p, s) => {
        setPage(p)
        setSize(s)
        applyLocalPage(p, s)
      }}
      aside={
        <XnTreePanel
          title="安全策略"
          width={380}
          filterable={false}
          footer={
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <XnButton
                listItem={buttonItems}
                selected={selected}
                onButtonClick={(a) => void buttonClick(a)}
              />
            </div>
          }
        >
          <Form
            layout="horizontal"
            labelCol={{ flex: '140px' }}
            wrapperCol={{ flex: 1 }}
            style={{ paddingRight: 4 }}
          >
            <div style={{ fontWeight: 600, margin: '4px 0 12px', fontSize: 13 }}>登录防护</div>
            <Form.Item label="失败锁定阈值">
              <InputNumber
                min={1}
                max={50}
                value={form.maxFailures}
                onChange={(v) => patch('maxFailures', Number(v) || 1)}
                style={{ width: 120 }}
              />
              <span style={hint}>次</span>
            </Form.Item>
            <Form.Item label="锁定时长">
              <InputNumber
                min={1}
                max={1440}
                value={form.lockMinutes}
                onChange={(v) => patch('lockMinutes', Number(v) || 1)}
                style={{ width: 120 }}
              />
              <span style={hint}>分钟</span>
            </Form.Item>
            <Form.Item label="IP 每分钟限流">
              <InputNumber
                min={1}
                max={1000}
                value={form.rateLimitPerMinute}
                onChange={(v) => patch('rateLimitPerMinute', Number(v) || 1)}
                style={{ width: 120 }}
              />
              <span style={hint}>次</span>
            </Form.Item>
            <Form.Item label="验证码有效期">
              <InputNumber
                min={30}
                max={600}
                value={form.captchaTtlSeconds}
                onChange={(v) => patch('captchaTtlSeconds', Number(v) || 30)}
                style={{ width: 120 }}
              />
              <span style={hint}>秒</span>
            </Form.Item>

            <div
              style={{
                fontWeight: 600,
                margin: '16px 0 12px',
                paddingTop: 12,
                borderTop: '1px solid #ebeef5',
                fontSize: 13,
              }}
            >
              密码策略
            </div>
            <Form.Item label="最小长度">
              <InputNumber
                min={6}
                max={50}
                value={form.pwdMinLength}
                onChange={(v) => patch('pwdMinLength', Number(v) || 6)}
                style={{ width: 120 }}
              />
              <span style={hint}>位</span>
            </Form.Item>
            <Form.Item label="最大长度">
              <InputNumber
                min={6}
                max={50}
                value={form.pwdMaxLength}
                onChange={(v) => patch('pwdMaxLength', Number(v) || 6)}
                style={{ width: 120 }}
              />
              <span style={hint}>位</span>
            </Form.Item>
            <Form.Item label="必须大写字母">
              <Switch
                checked={form.pwdRequireUpper}
                onChange={(v) => patch('pwdRequireUpper', v)}
              />
            </Form.Item>
            <Form.Item label="必须小写字母">
              <Switch
                checked={form.pwdRequireLower}
                onChange={(v) => patch('pwdRequireLower', v)}
              />
            </Form.Item>
            <Form.Item label="必须数字">
              <Switch
                checked={form.pwdRequireDigit}
                onChange={(v) => patch('pwdRequireDigit', v)}
              />
            </Form.Item>
            <Form.Item label="必须特殊字符">
              <Switch
                checked={form.pwdRequireSpecial}
                onChange={(v) => patch('pwdRequireSpecial', v)}
              />
            </Form.Item>
            <Form.Item label="密码有效期">
              <InputNumber
                min={0}
                max={3650}
                value={form.pwdExpireDays}
                onChange={(v) => patch('pwdExpireDays', Number(v) || 0)}
                style={{ width: 120 }}
              />
              <span style={hint}>天（0=不过期）</span>
            </Form.Item>
            <Form.Item label="历史密码限制">
              <InputNumber
                min={0}
                max={20}
                value={form.pwdHistoryCount}
                onChange={(v) => patch('pwdHistoryCount', Number(v) || 0)}
                style={{ width: 120 }}
              />
              <span style={hint}>次（0=不限制）</span>
            </Form.Item>
            <Form.Item label="新建/重置强制改密">
              <Switch
                checked={form.pwdForceChangeFirst}
                onChange={(v) => patch('pwdForceChangeFirst', v)}
              />
            </Form.Item>
            {form.updatedAt ? (
              <Form.Item label="最近更新">
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{form.updatedAt}</span>
              </Form.Item>
            ) : null}
            <p style={{ margin: '8px 0 0', fontSize: 12, lineHeight: 1.5, color: '#909399' }}>
              保存后立即生效。验证码开关请在「登录页设置」中配置；超级管理员不受强制改密/过期约束。
            </p>
          </Form>
        </XnTreePanel>
      }
      table={
        <XnTable
          data={tableData}
          total={total}
          loading={loading}
          page={page}
          pageSize={size}
          tableKey="system:security-policy"
          entityName="锁定账号"
          nameField="username"
          columns={columns}
          actionItems={tableButtonItems}
          onSelectionChange={(rows) => setSelected(rows as LockedAccount[])}
          onPageChange={(p, s) => {
            setPage(p)
            setSize(s)
            applyLocalPage(p, s)
          }}
          onRefresh={() => void loadData()}
          slots={{
            remainSeconds: ({ row }) =>
              formatRemain(Number((row as unknown as LockedAccount).remainSeconds || 0)),
            actions: ({ row }) => (
              <XnTableActions
                items={tableButtonItems}
                row={row}
                disabled={(action) =>
                  action === 'unlock' && unlocking === String(row.username ?? '')
                }
                onActionClick={({ action, row: r }) => {
                  if (action === 'unlock') void handleUnlock(String(r.username ?? ''))
                }}
              />
            ),
          }}
        />
      }
    />
  )
}
