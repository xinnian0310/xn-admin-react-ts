import { useEffect, useRef, useState } from 'react'
import { Image, Input, Tabs, message, Spin } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import XnAppIcon from '@/components/XnAppIcon'
import { getSiteContact, updateSiteContact } from '@/api/site-contact'
import { showCaughtError } from '@/utils/request'
import type { ButtonListItem } from '@/types/button'
import type { TableColumnItem } from '@/types/table'
import type { SaveMode } from '@/types/save'
import {
  contactTypeLabel,
  isQqContact,
  resolveContactType,
  type SiteContactConfig,
  type SiteContactItem,
  type SiteDonationQrcode,
} from '@/types/site-contact'
import ContactSave, { type ContactSaveHandle } from './contact-save'
import QrcodeSave, { type QrcodeSaveHandle } from './qrcode-save'
import './siteContact.scss'

type ContactRow = SiteContactItem & { __index?: number }
type QrRow = SiteDonationQrcode & { __index?: number }

const crudButtons: ButtonListItem[] = [
  {
    name: '编辑',
    action: 'edit',
    type: 'button',
    icon: 'Edit',
    typeColor: 'primary',
    index: 0,
  },
  {
    name: '查看',
    action: 'view',
    type: 'button',
    icon: 'View',
    typeColor: 'primary',
    index: 0,
  },
]

const tableActions: ButtonListItem[] = [
  { name: '编辑', type: 'button', action: 'edit' },
  { name: '查看', type: 'button', action: 'view' },
]

export default function SiteContactPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('contacts')
  const [donationTip, setDonationTip] = useState('')
  const [tipSnapshot, setTipSnapshot] = useState('')
  const [contacts, setContacts] = useState<SiteContactItem[]>([])
  const [qrcodes, setQrcodes] = useState<SiteDonationQrcode[]>([])
  const [contactSelected, setContactSelected] = useState<ContactRow[]>([])
  const [qrSelected, setQrSelected] = useState<QrRow[]>([])
  const contactSaveRef = useRef<ContactSaveHandle>(null)
  const qrSaveRef = useRef<QrcodeSaveHandle>(null)

  const contactColumns: TableColumnItem[] = [
    { type: 'selection', width: 50, fixed: true },
    { type: 'index', label: '序号', width: 60 },
    { type: 'slot', slot: 'icon', prop: 'icon', label: '图标', width: 140 },
    { prop: 'label', label: '标签', minWidth: 100 },
    { type: 'slot', slot: 'type', prop: 'type', label: '分类', width: 90 },
    { type: 'slot', slot: 'value', prop: 'value', label: '内容', minWidth: 220 },
    { type: 'slot', slot: 'link', prop: 'link', label: '链接', minWidth: 180 },
    { type: 'slot', slot: 'actions', label: '操作', width: 140, fixed: 'right' },
  ]

  const qrColumns: TableColumnItem[] = [
    { type: 'selection', width: 50, fixed: true },
    { type: 'index', label: '序号', width: 60 },
    { prop: 'label', label: '名称', minWidth: 160 },
    { type: 'slot', slot: 'src', prop: 'src', label: '二维码', width: 120, align: 'center' },
    { type: 'slot', slot: 'actions', label: '操作', width: 140, fixed: 'right' },
  ]

  function applyConfig(data: SiteContactConfig) {
    setContacts(
      (data.contacts ?? []).map((c) => {
        const item: SiteContactItem = {
          icon: c.icon || 'Link',
          label: c.label || '',
          type: resolveContactType(c),
          value: c.value || '',
          link: c.link || '',
        }
        if (item.type === 'qq') {
          const groups = (c.groups ?? [])
            .filter((g) => g.value?.trim())
            .map((g) => ({ value: g.value.trim(), full: Boolean(g.full) }))
          item.groups = groups.length
            ? groups
            : item.value
              ? [{ value: item.value, full: false }]
              : []
          if (item.groups.length) item.value = item.groups[0].value
          item.link = ''
        }
        return item
      }),
    )
    const tip = data.donation?.tip || ''
    setDonationTip(tip)
    setTipSnapshot(tip)
    setQrcodes(
      (data.donation?.qrcodes ?? []).map((q) => ({
        label: q.label || '',
        src: q.src || '',
      })),
    )
  }

  function buildPayload(
    nextContacts = contacts,
    nextTip = donationTip,
    nextQrs = qrcodes,
  ): SiteContactConfig {
    return {
      contacts: nextContacts.map((c) => {
        const type = resolveContactType(c)
        if (type === 'qq') {
          const groups = (c.groups ?? [])
            .map((g) => ({ value: String(g.value || '').trim(), full: Boolean(g.full) }))
            .filter((g) => g.value)
          return {
            icon: c.icon || 'ChatDotRound',
            label: c.label.trim(),
            type,
            value: groups[0]?.value || '',
            link: null,
            groups,
          }
        }
        if (type === 'email') {
          const email = c.value.trim()
          return {
            icon: c.icon || 'Message',
            label: c.label.trim(),
            type,
            value: email,
            link: email ? `mailto:${email}` : null,
          }
        }
        if (type === 'link') {
          return {
            icon: c.icon || 'Link',
            label: c.label.trim(),
            type,
            value: c.value.trim(),
            link: c.link?.trim() || null,
          }
        }
        return {
          icon: c.icon || 'Link',
          label: c.label.trim(),
          type: 'text',
          value: c.value.trim(),
          link: null,
        }
      }),
      donation: {
        tip: nextTip.trim(),
        qrcodes: nextQrs.map((q) => ({
          label: q.label.trim(),
          src: q.src.trim(),
        })),
      },
    }
  }

  async function loadConfig() {
    setLoading(true)
    try {
      const res = await getSiteContact()
      applyConfig(res.data)
    } catch (e: unknown) {
      showCaughtError(e, '加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function persist(payload: SiteContactConfig, successMsg: string) {
    setLoading(true)
    try {
      const res = await updateSiteContact(payload)
      applyConfig(res.data)
      message.success(successMsg)
    } catch (e: unknown) {
      showCaughtError(e, '操作失败')
      await loadConfig()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    void getSiteContact()
      .then((res) => {
        if (!cancelled) applyConfig(res.data)
      })
      .catch((e: unknown) => {
        if (!cancelled) showCaughtError(e, '加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function saveDonationTip() {
    if (donationTip.trim() === tipSnapshot.trim()) return
    await persist(buildPayload(), '捐赠说明已保存')
  }

  function resolveRowIndex(row: Record<string, unknown>, listLen: number) {
    const idx = Number(row.__index)
    if (Number.isInteger(idx) && idx >= 0 && idx < listLen) return idx
    return -1
  }

  function onContactToolbar(action: string) {
    if (contactSelected.length !== 1) {
      message.warning('请选择一项操作')
      return
    }
    const row = contactSelected[0]
    const index = contacts.findIndex(
      (c) => c.label === row.label && c.value === row.value && c.link === row.link,
    )
    const resolved =
      index >= 0
        ? index
        : resolveRowIndex(row as unknown as Record<string, unknown>, contacts.length)
    if (resolved < 0) {
      message.warning('未找到选中项')
      return
    }
    if (action === 'edit') contactSaveRef.current?.open('edit', contacts[resolved], resolved)
    if (action === 'view') contactSaveRef.current?.open('view', contacts[resolved], resolved)
  }

  function onQrToolbar(action: string) {
    if (qrSelected.length !== 1) {
      message.warning('请选择一项操作')
      return
    }
    const row = qrSelected[0]
    const index = qrcodes.findIndex((q) => q.label === row.label && q.src === row.src)
    const resolved =
      index >= 0
        ? index
        : resolveRowIndex(row as unknown as Record<string, unknown>, qrcodes.length)
    if (resolved < 0) {
      message.warning('未找到选中项')
      return
    }
    if (action === 'edit') qrSaveRef.current?.open('edit', qrcodes[resolved], resolved)
    if (action === 'view') qrSaveRef.current?.open('view', qrcodes[resolved], resolved)
  }

  async function onContactSaved(payload: {
    mode: SaveMode
    index: number | null
    data: SiteContactItem
  }) {
    if (payload.mode !== 'edit' || payload.index == null) return
    const next = [...contacts]
    next[payload.index] = payload.data
    await persist(buildPayload(next), '更新成功')
  }

  async function onQrSaved(payload: {
    mode: SaveMode
    index: number | null
    data: SiteDonationQrcode
  }) {
    if (payload.mode !== 'edit' || payload.index == null) return
    const next = [...qrcodes]
    next[payload.index] = payload.data
    await persist(buildPayload(contacts, donationTip, next), '更新成功')
  }

  const contactRows = contacts.map((c, i) => ({ ...c, __index: i, id: i }))
  const qrRows = qrcodes.map((q, i) => ({ ...q, __index: i, id: i }))

  return (
    <div className="page-card site-contact-page" style={{ padding: 16 }}>
      <Spin spinning={loading} classNames={{ root: 'site-contact-page__spin' }}>
        <div className="site-contact-page__heading">
          <h2>联系与捐赠</h2>
          <p className="site-contact-page__hint">
            图标与标签固定；每项可选择分类（文本 / 链接 / 邮箱 /
            QQ群），内容表单随分类变化。QQ群支持多群号与已满状态。修改后立即同步。
          </p>
        </div>

        <Tabs
          className="site-contact-page__tabs"
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'contacts',
              label: '联系我们',
              children: (
                <div className="site-contact-page__pane">
                  <XnPageLayout
                    showViewSwitch={false}
                    showPagination={false}
                    toolbar={
                      <XnButton
                        listItem={crudButtons}
                        selected={contactSelected}
                        onButtonClick={onContactToolbar}
                      />
                    }
                    table={
                      <XnTable
                        data={contactRows as unknown as Record<string, unknown>[]}
                        total={contacts.length}
                        loading={false}
                        tableKey="system:site-contact:contacts"
                        entityName="联系项"
                        nameField="label"
                        columns={contactColumns}
                        actionItems={tableActions}
                        showPagination={false}
                        onSelectionChange={(rows) => setContactSelected(rows as ContactRow[])}
                        slots={{
                          icon: ({ row }) => (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              {row.icon ? <XnAppIcon name={String(row.icon)} /> : null}
                              <span>{String(row.icon || '—')}</span>
                            </span>
                          ),
                          type: ({ row }) =>
                            contactTypeLabel(resolveContactType(row as unknown as SiteContactItem)),
                          value: ({ row }) => {
                            const item = row as unknown as SiteContactItem
                            if (isQqContact(item) && item.groups?.length) {
                              return (
                                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {item.groups.map((g, gi) => (
                                    <span
                                      key={gi}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        textDecoration: g.full ? 'line-through' : undefined,
                                        opacity: g.full ? 0.7 : 1,
                                      }}
                                    >
                                      <XnAppIcon name="ri:qq-fill" size={14} />
                                      {g.value}
                                      {g.full ? (
                                        <em style={{ fontStyle: 'normal' }}>已满</em>
                                      ) : null}
                                    </span>
                                  ))}
                                </span>
                              )
                            }
                            return <span>{item.value || '—'}</span>
                          },
                          link: ({ row }) => {
                            const item = row as unknown as SiteContactItem
                            if (resolveContactType(item) === 'qq') {
                              return <span style={{ color: '#94a3b8' }}>—</span>
                            }
                            if (item.link) {
                              return (
                                <a href={item.link} target="_blank" rel="noopener noreferrer">
                                  {item.link}
                                </a>
                              )
                            }
                            return <span style={{ color: '#94a3b8' }}>—</span>
                          },
                          actions: ({ row }) => (
                            <XnTableActions
                              items={tableActions}
                              row={row}
                              onActionClick={({ action, row: r }) => {
                                const index = resolveRowIndex(r, contacts.length)
                                if (index < 0) return
                                if (action === 'edit') {
                                  contactSaveRef.current?.open('edit', contacts[index], index)
                                }
                                if (action === 'view') {
                                  contactSaveRef.current?.open('view', contacts[index], index)
                                }
                              }}
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
              key: 'donation',
              label: '捐赠二维码',
              children: (
                <div className="site-contact-page__pane">
                  <div className="site-contact-page__donation-tip">
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 600 }}>捐赠说明</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        展示在管理端首页与官网捐赠区域上方，失焦后自动保存
                      </div>
                    </div>
                    <Input.TextArea
                      rows={2}
                      maxLength={200}
                      showCount
                      value={donationTip}
                      placeholder="例如：如果这个项目对你有帮助，欢迎请作者喝杯咖啡"
                      onChange={(e) => setDonationTip(e.target.value)}
                      onBlur={() => void saveDonationTip()}
                    />
                  </div>

                  <XnPageLayout
                    showViewSwitch={false}
                    showPagination={false}
                    toolbar={
                      <XnButton
                        listItem={crudButtons}
                        selected={qrSelected}
                        onButtonClick={onQrToolbar}
                      />
                    }
                    table={
                      <XnTable
                        data={qrRows as unknown as Record<string, unknown>[]}
                        total={qrcodes.length}
                        loading={false}
                        tableKey="system:site-contact:qrcodes"
                        entityName="捐赠二维码"
                        nameField="label"
                        columns={qrColumns}
                        actionItems={tableActions}
                        showPagination={false}
                        onSelectionChange={(rows) => setQrSelected(rows as QrRow[])}
                        slots={{
                          src: ({ row }) => {
                            const src = String(row.src || '')
                            return src ? (
                              <Image
                                src={src}
                                width={64}
                                height={64}
                                style={{ objectFit: 'contain' }}
                              />
                            ) : (
                              <span style={{ color: '#94a3b8' }}>未上传</span>
                            )
                          },
                          actions: ({ row }) => (
                            <XnTableActions
                              items={tableActions}
                              row={row}
                              onActionClick={({ action, row: r }) => {
                                const index = resolveRowIndex(r, qrcodes.length)
                                if (index < 0) return
                                if (action === 'edit') {
                                  qrSaveRef.current?.open('edit', qrcodes[index], index)
                                }
                                if (action === 'view') {
                                  qrSaveRef.current?.open('view', qrcodes[index], index)
                                }
                              }}
                            />
                          ),
                        }}
                      />
                    }
                  />
                </div>
              ),
            },
          ]}
        />
      </Spin>

      <ContactSave ref={contactSaveRef} onSuccess={(p) => void onContactSaved(p)} />
      <QrcodeSave ref={qrSaveRef} onSuccess={(p) => void onQrSaved(p)} />
    </div>
  )
}
