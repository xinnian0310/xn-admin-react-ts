import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Switch,
  Tabs,
  Upload,
  Image,
  Spin,
  message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import SectionActions from './section-actions'
import {
  appConfig,
  applyRemoteAppConfig,
  applyUserUiPreference,
  captureGlobalUiBaseline,
  cloneAntdUi,
  defaultAppConfig,
  type AppConfig,
  type LayoutMode,
} from '@/config/app'
import { APP_CLIENT_ID } from '@/config/client'
import {
  getSystemConfig,
  getSystemConfigSection,
  updateSystemConfigSection,
  uploadBrandAsset,
  type SystemConfigPayload,
  type SystemConfigSection,
} from '@/api/system-config'
import { showCaughtError } from '@/utils/request'
import { useUiPreferenceStore } from '@/stores/uiPreference'
import { parsePxInt, toPx } from '@/utils/px'
import './systemConfig.scss'

type ConfigEditableSection = Exclude<SystemConfigSection, 'storage'>

function createForm(): SystemConfigPayload {
  const d = JSON.parse(JSON.stringify(defaultAppConfig)) as AppConfig
  return {
    app: { ...d.app, clients: {} },
    session: { ...d.session },
    ui: {
      dialog: { ...d.ui.dialog },
      layout: { mode: d.ui.layout.mode },
      fontSize: { ...d.ui.fontSize },
      tagsView: { ...d.ui.tagsView },
      antd: cloneAntdUi(d.ui.antd),
    },
    storage: { ...d.storage },
    logRetention: { ...d.logRetention },
    sensitiveData: {
      enabled: d.sensitiveData.enabled,
      fields: [...d.sensitiveData.fields],
    },
  }
}

const hintStyle = { marginLeft: 8, color: '#94a3b8', fontSize: 12 }

export default function SystemConfigPage() {
  const clientId = APP_CLIENT_ID
  const [loading, setLoading] = useState(false)
  const [savingSection, setSavingSection] = useState<ConfigEditableSection | ''>('')
  const [activeTab, setActiveTab] = useState<ConfigEditableSection>('app')
  const [form, setForm] = useState<SystemConfigPayload>(() => createForm())
  /** 共享兜底 name（写入 app.name，供未配置 clients 的工程使用）；介绍只存 clients */
  const [sharedBrand, setSharedBrand] = useState({ name: '' })
  const [brandIconList, setBrandIconList] = useState<UploadFile[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [editing, setEditing] = useState<Record<ConfigEditableSection, boolean>>({
    app: false,
    session: false,
    ui: false,
    logRetention: false,
    sensitiveData: false,
  })
  /** 进入编辑态时的分区快照，取消时回滚 */
  const snapshots = useRef<Partial<Record<ConfigEditableSection, string>>>({})

  function brandIconUrl(source = form) {
    return (source.app.logo || source.app.favicon || '').trim()
  }

  function syncBrandIconList(url: string) {
    if (!url) {
      setBrandIconList([])
      return
    }
    setBrandIconList([{ uid: String(Date.now()), name: 'brand-icon', status: 'done', url }])
  }

  function applyBrandIcon(url: string) {
    setForm((prev) => ({ ...prev, app: { ...prev.app, logo: url, favicon: url } }))
    syncBrandIconList(url)
  }

  function applyAppSection(app: SystemConfigPayload['app']) {
    const clients = { ...(app?.clients || {}) }
    const profile = clients[APP_CLIENT_ID]
    const icon = (app?.logo || app?.favicon || '').trim()
    setSharedBrand({ name: app?.name || '' })
    syncBrandIconList(icon)
    setForm((prev) => ({
      ...prev,
      app: {
        ...prev.app,
        ...app,
        clients,
        logo: icon,
        favicon: icon,
        // 名称：本工程 profile > 本地默认 > 共享兜底；介绍只认云端 clients
        name: profile?.name || defaultAppConfig.app.name || app?.name || '',
        intro: profile?.intro ?? '',
      },
    }))
  }

  function applyUiSection(ui: Partial<SystemConfigPayload['ui']>) {
    setForm((prev) => ({
      ...prev,
      ui: {
        dialog: { ...prev.ui.dialog, ...ui?.dialog },
        layout: { mode: (ui?.layout?.mode || 'side') as LayoutMode },
        fontSize: { ...prev.ui.fontSize, ...ui?.fontSize },
        tagsView: { ...prev.ui.tagsView, ...ui?.tagsView },
        antd: cloneAntdUi({ ...prev.ui.antd, ...(ui?.antd || {}) }),
      },
    }))
  }

  function applySensitiveSection(sd?: SystemConfigPayload['sensitiveData'] | null) {
    setForm((prev) => ({
      ...prev,
      sensitiveData: {
        enabled: sd?.enabled !== false,
        fields: [...(sd?.fields?.length ? sd.fields : defaultAppConfig.sensitiveData.fields)],
      },
    }))
  }

  function applySectionData(section: ConfigEditableSection, data: unknown) {
    if (data == null) return
    switch (section) {
      case 'app':
        applyAppSection(data as SystemConfigPayload['app'])
        break
      case 'session':
        setForm((prev) => ({
          ...prev,
          session: { ...prev.session, ...(data as SystemConfigPayload['session']) },
        }))
        break
      case 'ui':
        applyUiSection(data as SystemConfigPayload['ui'])
        break
      case 'logRetention':
        setForm((prev) => ({
          ...prev,
          logRetention: { ...prev.logRetention, ...(data as SystemConfigPayload['logRetention']) },
        }))
        break
      case 'sensitiveData':
        applySensitiveSection(data as SystemConfigPayload['sensitiveData'])
        break
    }
  }

  function assignForm(data: SystemConfigPayload) {
    applyAppSection(data.app)
    setForm((prev) => ({
      ...prev,
      session: { ...prev.session, ...data.session },
      storage: { ...(data.storage || {}) },
      logRetention: {
        ...prev.logRetention,
        ...(data.logRetention || defaultAppConfig.logRetention),
      },
    }))
    applyUiSection(data.ui || {})
    applySensitiveSection(data.sensitiveData || defaultAppConfig.sensitiveData)
  }

  async function loadConfig() {
    setLoading(true)
    try {
      const res = await getSystemConfig()
      if (res.data) assignForm(res.data)
    } catch (e: unknown) {
      showCaughtError(e, '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    assignForm({
      app: { ...appConfig.app },
      session: { ...appConfig.session },
      ui: {
        dialog: { ...appConfig.ui.dialog },
        layout: { mode: appConfig.ui.layout.mode },
        fontSize: { ...appConfig.ui.fontSize },
        tagsView: { ...appConfig.ui.tagsView },
        antd: cloneAntdUi(appConfig.ui.antd),
      },
      storage: { ...appConfig.storage },
      logRetention: { ...appConfig.logRetention },
      sensitiveData: {
        enabled: appConfig.sensitiveData.enabled,
        fields: [...appConfig.sensitiveData.fields],
      },
    })
    void loadConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function buildSectionPayload(section: ConfigEditableSection): unknown {
    if (section === 'app') {
      const icon = brandIconUrl()
      const clientName = form.app.name.trim()
      const clientIntro = form.app.intro ?? ''
      return {
        ...form.app,
        logo: icon,
        favicon: icon,
        clients: {
          ...(form.app.clients || {}),
          [APP_CLIENT_ID]: { name: clientName, intro: clientIntro },
        },
        name: (sharedBrand.name || clientName).trim(),
        intro: '',
      }
    }
    return JSON.parse(JSON.stringify(form[section]))
  }

  function sectionOfPayload(section: ConfigEditableSection, payload: SystemConfigPayload): unknown {
    return payload[section]
  }

  function startEdit(section: ConfigEditableSection) {
    snapshots.current[section] = JSON.stringify(buildSectionPayload(section))
    setEditing((prev) => ({ ...prev, [section]: true }))
  }

  function cancelEdit(section: ConfigEditableSection) {
    const raw = snapshots.current[section]
    if (raw) applySectionData(section, JSON.parse(raw))
    delete snapshots.current[section]
    setEditing((prev) => ({ ...prev, [section]: false }))
  }

  async function refreshSection(section: ConfigEditableSection) {
    setLoading(true)
    try {
      const res = await getSystemConfigSection(section)
      applySectionData(section, res.data)
      message.success('已刷新')
    } catch (e: unknown) {
      showCaughtError(e, '刷新失败')
    } finally {
      setLoading(false)
    }
  }

  /** 保存返回的是全量配置，回填时保留本工程的项目名 / 介绍 */
  function withClientBrand(payload: SystemConfigPayload): SystemConfigPayload {
    const clientName =
      payload.app?.clients?.[APP_CLIENT_ID]?.name || form.app.name || defaultAppConfig.app.name
    const clientIntro = payload.app?.clients?.[APP_CLIENT_ID]?.intro ?? form.app.intro ?? ''
    return { ...payload, app: { ...payload.app, name: clientName, intro: clientIntro } }
  }

  function validateSection(section: ConfigEditableSection): boolean {
    if (section === 'app' && !form.app.name?.trim()) {
      message.warning('项目名称不能为空')
      return false
    }
    return true
  }

  async function saveSection(section: ConfigEditableSection) {
    if (!validateSection(section)) return
    setSavingSection(section)
    try {
      const res = await updateSystemConfigSection(section, buildSectionPayload(section))
      if (res.data) {
        applySectionData(section, sectionOfPayload(section, res.data))
        applyRemoteAppConfig(withClientBrand(res.data))
        if (section === 'ui') {
          captureGlobalUiBaseline()
          const pref = useUiPreferenceStore.getState().preference
          if (pref) applyUserUiPreference(pref)
        }
      }
      delete snapshots.current[section]
      setEditing((prev) => ({ ...prev, [section]: false }))
      message.success('保存成功，已即时生效')
    } catch (e: unknown) {
      showCaughtError(e, '保存失败')
    } finally {
      setSavingSection('')
    }
  }

  function patchApp<K extends keyof SystemConfigPayload['app']>(
    key: K,
    value: SystemConfigPayload['app'][K],
  ) {
    setForm((prev) => ({ ...prev, app: { ...prev.app, [key]: value } }))
  }

  const idleTimeoutMin = Math.round(form.session.idleTimeoutMs / 60000)
  const refreshIntervalMin = Math.round(form.session.refreshIntervalMs / 60000)
  const idleCheckIntervalSec = Math.round(form.session.idleCheckIntervalMs / 1000)

  function sectionActions(section: ConfigEditableSection, formWidth = 720) {
    return (
      <div className="system-config-page__section-actions-wrap" style={{ maxWidth: formWidth }}>
        <SectionActions
          editing={editing[section]}
          saving={savingSection === section}
          onEdit={() => startEdit(section)}
          onSave={() => void saveSection(section)}
          onCancel={() => cancelEdit(section)}
          onRefresh={() => void refreshSection(section)}
        />
      </div>
    )
  }

  const tabItems = [
    {
      key: 'app',
      label: '应用信息',
      children: (
        <>
          <Form labelCol={{ span: 4 }} style={{ maxWidth: 720 }} disabled={!editing.app}>
            <Form.Item label="项目名称" required>
              <Input
                maxLength={50}
                value={form.app.name}
                placeholder="侧栏 / 登录页 / 管理端首页标题 / 官网项目副标题（仅本工程）"
                onChange={(e) => patchApp('name', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="应用介绍">
              <Input.TextArea
                rows={4}
                maxLength={500}
                showCount
                value={form.app.intro}
                placeholder="管理端首页与官网开源项目介绍文案（仅本工程）"
                onChange={(e) => patchApp('intro', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="页脚">
              <Input
                maxLength={200}
                value={form.app.footer}
                placeholder="留空则不显示页脚"
                onChange={(e) => patchApp('footer', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="品牌图标">
              <Upload
                disabled={!editing.app}
                listType="picture-card"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
                fileList={brandIconList}
                maxCount={1}
                showUploadList={{ showRemoveIcon: editing.app }}
                onPreview={(file) => {
                  const url = file.url || brandIconUrl()
                  if (!url) return
                  setPreviewUrl(url)
                  setPreviewOpen(true)
                }}
                onRemove={() => applyBrandIcon('')}
                customRequest={async (opt) => {
                  try {
                    const res = await uploadBrandAsset(opt.file as File)
                    const url = res.data?.url
                    if (!url) throw new Error('上传失败')
                    applyBrandIcon(url)
                    message.success('上传成功')
                    opt.onSuccess?.(res)
                  } catch (e: unknown) {
                    showCaughtError(e, '上传失败')
                    opt.onError?.(e as Error)
                  }
                }}
                onChange={({ fileList }) => {
                  if (fileList.length > 1) message.warning('仅允许上传一张品牌图标')
                }}
              >
                {brandIconList.length >= 1 || !editing.app ? null : (
                  <div>
                    <PlusOutlined />
                  </div>
                )}
              </Upload>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                一张图同时用于浏览器标签图标与侧栏 / 登录页 Logo
              </div>
            </Form.Item>
            <Form.Item label="图标宽度">
              <InputNumber
                min={1}
                max={200}
                value={form.app.logoWidth ?? undefined}
                onChange={(v) => patchApp('logoWidth', v == null ? null : Number(v))}
              />
              <span style={hintStyle}>px；清空表示按比例自适应</span>
            </Form.Item>
            <Form.Item label="图标高度">
              <InputNumber
                min={1}
                max={200}
                value={form.app.logoHeight ?? undefined}
                onChange={(v) => patchApp('logoHeight', v == null ? null : Number(v))}
              />
              <span style={hintStyle}>px；清空表示按比例自适应</span>
            </Form.Item>
          </Form>
          {sectionActions('app')}
        </>
      ),
    },
    {
      key: 'session',
      label: '会话策略',
      children: (
        <>
          <Form labelCol={{ span: 5 }} style={{ maxWidth: 640 }} disabled={!editing.session}>
            <Form.Item label="空闲自动登出">
              <Switch
                checked={form.session.idleLogoutEnabled}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    session: { ...prev.session, idleLogoutEnabled: v },
                  }))
                }
              />
            </Form.Item>
            <Form.Item label="空闲超时">
              <InputNumber
                min={1}
                max={1440}
                value={idleTimeoutMin}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    session: {
                      ...prev.session,
                      idleTimeoutMs: Math.max(1, Number(v) || 1) * 60000,
                    },
                  }))
                }
              />
              <span style={hintStyle}>分钟</span>
            </Form.Item>
            <Form.Item label="滑动续期">
              <Switch
                checked={form.session.slidingRefreshEnabled}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    session: { ...prev.session, slidingRefreshEnabled: v },
                  }))
                }
              />
            </Form.Item>
            <Form.Item label="续期间隔">
              <InputNumber
                min={1}
                max={120}
                value={refreshIntervalMin}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    session: {
                      ...prev.session,
                      refreshIntervalMs: Math.max(1, Number(v) || 1) * 60000,
                    },
                  }))
                }
              />
              <span style={hintStyle}>分钟</span>
            </Form.Item>
            <Form.Item label="空闲检测间隔">
              <InputNumber
                min={5}
                max={300}
                value={idleCheckIntervalSec}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    session: {
                      ...prev.session,
                      idleCheckIntervalMs: Math.max(5, Number(v) || 5) * 1000,
                    },
                  }))
                }
              />
              <span style={hintStyle}>秒</span>
            </Form.Item>
          </Form>
          {sectionActions('session', 640)}
        </>
      ),
    },
    {
      key: 'ui',
      label: '布局与 UI',
      children: (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <h3 style={{ marginTop: 0 }}>布局与字号</h3>
              <p style={{ color: '#64748b', fontSize: 13 }}>
                通用默认；登录用户可在右下角悬浮入口单独覆盖。字号 / 高度填正整数，单位 px
                自动带入。
              </p>
              <Form labelCol={{ span: 8 }} disabled={!editing.ui}>
                <Form.Item label="布局模式">
                  <Radio.Group
                    value={form.ui.layout.mode}
                    optionType="button"
                    options={[
                      { label: '左侧', value: 'side' },
                      { label: '顶部', value: 'top' },
                      { label: '混合', value: 'mix' },
                      { label: '双列', value: 'columns' },
                    ]}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        ui: { ...prev.ui, layout: { mode: e.target.value } },
                      }))
                    }
                  />
                </Form.Item>
                <Form.Item label="弹窗最大高度">
                  <Input
                    value={form.ui.dialog.maxHeight}
                    placeholder="如 80vh"
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        ui: {
                          ...prev.ui,
                          dialog: { ...prev.ui.dialog, maxHeight: e.target.value },
                        },
                      }))
                    }
                  />
                </Form.Item>
                {(
                  [
                    ['标签栏高度', 'tagsView', 'height', 40, 120],
                    ['侧栏字号', 'fontSize', 'sidebar', 14, 48],
                    ['顶栏字号', 'fontSize', 'header', 14, 48],
                    ['标签栏字号', 'fontSize', 'tagsView', 14, 48],
                    ['正文字号', 'fontSize', 'main', 14, 48],
                  ] as const
                ).map(([label, group, key, fallback, max]) => {
                  const raw =
                    group === 'tagsView'
                      ? form.ui.tagsView.height
                      : form.ui.fontSize[key as keyof typeof form.ui.fontSize]
                  return (
                    <Form.Item key={`${group}-${key}`} label={label}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <InputNumber
                          min={1}
                          max={max}
                          step={1}
                          precision={0}
                          style={{ width: 140 }}
                          value={parsePxInt(raw, fallback)}
                          onChange={(v) => {
                            const px = toPx(Number(v), fallback)
                            setForm((prev) => {
                              if (group === 'tagsView') {
                                return {
                                  ...prev,
                                  ui: {
                                    ...prev.ui,
                                    tagsView: { ...prev.ui.tagsView, height: px },
                                  },
                                }
                              }
                              return {
                                ...prev,
                                ui: {
                                  ...prev.ui,
                                  fontSize: { ...prev.ui.fontSize, [key]: px },
                                },
                              }
                            })
                          }}
                        />
                        <span style={{ color: '#94a3b8', fontSize: 13 }}>px</span>
                      </div>
                    </Form.Item>
                  )
                })}
              </Form>
            </div>
            <div>
              <h3 style={{ marginTop: 0 }}>组件全局</h3>
              <p style={{ color: '#64748b', fontSize: 13 }}>
                对应本工程 ui.antd。未提交的云端字段由后端深合并保留。主题色请用右上角主题面板。
              </p>
              <Form labelCol={{ span: 8 }} disabled={!editing.ui}>
                <Form.Item label="locale">
                  <Select
                    value={form.ui.antd.locale}
                    options={[
                      { label: '简体中文', value: 'zh-cn' },
                      { label: 'English', value: 'en' },
                    ]}
                    onChange={(v) =>
                      setForm((prev) => ({
                        ...prev,
                        ui: {
                          ...prev.ui,
                          antd: { ...prev.ui.antd, locale: v },
                        },
                      }))
                    }
                  />
                </Form.Item>
                <Form.Item label="componentSize">
                  <Radio.Group
                    value={form.ui.antd.componentSize}
                    optionType="button"
                    options={[
                      { label: 'large', value: 'large' },
                      { label: 'middle', value: 'middle' },
                      { label: 'small', value: 'small' },
                    ]}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        ui: {
                          ...prev.ui,
                          antd: { ...prev.ui.antd, componentSize: e.target.value },
                        },
                      }))
                    }
                  />
                </Form.Item>
                <Form.Item label="prefixCls">
                  <Input
                    value={form.ui.antd.prefixCls}
                    placeholder="默认 ant"
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        ui: {
                          ...prev.ui,
                          antd: { ...prev.ui.antd, prefixCls: e.target.value },
                        },
                      }))
                    }
                  />
                </Form.Item>
                <Form.Item label="button.autoInsertSpace">
                  <Switch
                    checked={form.ui.antd.button.autoInsertSpace}
                    onChange={(v) =>
                      setForm((prev) => ({
                        ...prev,
                        ui: {
                          ...prev.ui,
                          antd: {
                            ...prev.ui.antd,
                            button: { ...prev.ui.antd.button, autoInsertSpace: v },
                          },
                        },
                      }))
                    }
                  />
                </Form.Item>
                <Form.Item label="message.maxCount">
                  <InputNumber
                    min={1}
                    max={20}
                    style={{ width: '100%' }}
                    value={form.ui.antd.message.maxCount}
                    onChange={(v) =>
                      setForm((prev) => ({
                        ...prev,
                        ui: {
                          ...prev.ui,
                          antd: {
                            ...prev.ui.antd,
                            message: { ...prev.ui.antd.message, maxCount: Number(v) || 3 },
                          },
                        },
                      }))
                    }
                  />
                </Form.Item>
                <Form.Item label="modal.centered">
                  <Switch
                    checked={form.ui.antd.modal.centered}
                    onChange={(v) =>
                      setForm((prev) => ({
                        ...prev,
                        ui: {
                          ...prev.ui,
                          antd: {
                            ...prev.ui.antd,
                            modal: { ...prev.ui.antd.modal, centered: v },
                          },
                        },
                      }))
                    }
                  />
                </Form.Item>
                <Form.Item label="modal.draggable">
                  <Switch
                    checked={form.ui.antd.modal.draggable}
                    onChange={(v) =>
                      setForm((prev) => ({
                        ...prev,
                        ui: {
                          ...prev.ui,
                          antd: {
                            ...prev.ui.antd,
                            modal: { ...prev.ui.antd.modal, draggable: v },
                          },
                        },
                      }))
                    }
                  />
                </Form.Item>
              </Form>
            </div>
          </div>
          {sectionActions('ui')}
        </>
      ),
    },
    {
      key: 'logRetention',
      label: '日志保留',
      children: (
        <>
          <Form labelCol={{ span: 5 }} style={{ maxWidth: 560 }} disabled={!editing.logRetention}>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="定时任务「日志保留清理」每天凌晨按此天数删除过期日志；设为 0 表示不自动清理该类日志。"
            />
            {(
              [
                ['登录日志', 'loginDays'],
                ['操作日志', 'operDays'],
                ['异常日志', 'exceptionDays'],
                ['任务日志', 'jobDays'],
              ] as const
            ).map(([label, key]) => (
              <Form.Item key={key} label={label}>
                <InputNumber
                  min={0}
                  max={3650}
                  value={form.logRetention[key]}
                  onChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      logRetention: { ...prev.logRetention, [key]: Number(v) || 0 },
                    }))
                  }
                />
                <span style={hintStyle}>天</span>
              </Form.Item>
            ))}
          </Form>
          {sectionActions('logRetention', 560)}
        </>
      ),
    },
    {
      key: 'sensitiveData',
      label: '数据脱敏',
      children: (
        <>
          <Form labelCol={{ span: 5 }} style={{ maxWidth: 640 }} disabled={!editing.sensitiveData}>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="无「查看敏感信息」权限的角色，在用户列表/详情/导出中会对勾选字段打码。授权：角色权限 → 用户管理 → 敏感信息。"
            />
            <Form.Item label="启用脱敏">
              <Switch
                checked={form.sensitiveData.enabled}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    sensitiveData: { ...prev.sensitiveData, enabled: v },
                  }))
                }
              />
              <span style={hintStyle}>关闭后不再打码</span>
            </Form.Item>
            <Form.Item label="敏感字段">
              <Checkbox.Group
                value={form.sensitiveData.fields}
                options={[
                  { label: '手机号', value: 'phone' },
                  { label: '邮箱', value: 'email' },
                ]}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    sensitiveData: { ...prev.sensitiveData, fields: v as string[] },
                  }))
                }
              />
            </Form.Item>
          </Form>
          {sectionActions('sensitiveData', 640)}
        </>
      ),
    },
  ]

  return (
    <div className="page-card system-config-page" style={{ padding: 16 }}>
      <Spin spinning={loading} classNames={{ root: 'system-config-page__spin' }}>
        <div className="system-config-page__header">
          <div className="system-config-page__heading">
            <h2>系统配置</h2>
            <p className="system-config-page__hint">
              与前端 app.ts
              对齐：每个分区一套独立接口，点「修改」后才可编辑，保存后即时生效。登录页背景/验证码请在「登录页设置」中配置；主题色请在右上角主题面板调整。
              「项目名称 / 应用介绍」按当前前端工程（{clientId}）单独存储，不影响其他前端项目。
            </p>
          </div>
        </div>

        <Tabs
          className="system-config-page__tabs"
          tabPosition="left"
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as ConfigEditableSection)}
          items={tabItems}
        />
      </Spin>

      <Image
        style={{ display: 'none' }}
        preview={{
          visible: previewOpen,
          src: previewUrl,
          onVisibleChange: (v) => setPreviewOpen(v),
        }}
      />
    </div>
  )
}
