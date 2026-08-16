import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Drawer, Form, Input, InputNumber, Radio, Space, message } from 'antd'
import type { InputNumberProps } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useUiPreferenceStore } from '@/stores/uiPreference'
import { useThemeStore } from '@/stores/theme'
import { appConfig, type LayoutMode } from '@/config/app'
import { parsePxInt, toPx } from '@/utils/px'
import './uiPreferenceFab.scss'

const STORAGE_KEY = 'xn-ui-pref-fab-top'
const FAB_HEIGHT = 48
const DRAG_THRESHOLD = 4
/** 距右边缘多少像素内视为「靠近」 */
const EDGE_PROXIMITY = 28
/** 垂直方向额外感应范围 */
const Y_PAD = 48

/** 正整数像素输入：仅数字，右侧带 px */
function PxInputNumber({ max, ...rest }: { max: number } & Omit<InputNumberProps, 'max'>) {
  return (
    <div className="ui-pref-px-field">
      <InputNumber min={1} max={max} step={1} precision={0} controls {...rest} />
      <span className="ui-pref-px-field__unit">px</span>
    </div>
  )
}

type PrefForm = {
  layoutMode: LayoutMode
  dialogMaxHeight: string
  tagsViewHeight: number
  sidebar: number
  header: number
  tagsView: number
  main: number
}

function clampTop(value: number) {
  const max = Math.max(8, window.innerHeight - FAB_HEIGHT - 8)
  return Math.min(max, Math.max(8, Math.round(value)))
}

function loadTop() {
  if (typeof window === 'undefined') return 400
  const raw = localStorage.getItem(STORAGE_KEY)
  const n = raw ? Number(raw) : NaN
  if (Number.isFinite(n)) return clampTop(n)
  return Math.round(window.innerHeight * 0.62)
}

function readFormFromApp(): PrefForm {
  return {
    layoutMode: appConfig.ui.layout.mode,
    dialogMaxHeight: appConfig.ui.dialog.maxHeight,
    tagsViewHeight: parsePxInt(appConfig.ui.tagsView.height, 40),
    sidebar: parsePxInt(appConfig.ui.fontSize.sidebar, 14),
    header: parsePxInt(appConfig.ui.fontSize.header, 14),
    tagsView: parsePxInt(appConfig.ui.fontSize.tagsView, 14),
    main: parsePxInt(appConfig.ui.fontSize.main, 14),
  }
}

export default function XnUiPreferenceFab() {
  const drawerVisible = useUiPreferenceStore((s) => s.drawerVisible)
  const openDrawer = useUiPreferenceStore((s) => s.openDrawer)
  const closeDrawer = useUiPreferenceStore((s) => s.closeDrawer)
  const save = useUiPreferenceStore((s) => s.save)
  const reset = useUiPreferenceStore((s) => s.reset)
  const primary = useThemeStore((s) => s.currentTheme.colors.primary)

  const [form] = Form.useForm<PrefForm>()
  const [topPx, setTopPx] = useState(loadTop)
  const [dragging, setDragging] = useState(false)
  const [peek, setPeek] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  const dragRef = useRef({
    pointerId: null as number | null,
    startY: 0,
    startTop: 0,
    moved: false,
  })

  const persistTop = useCallback((value: number) => {
    localStorage.setItem(STORAGE_KEY, String(value))
  }, [])

  useEffect(() => {
    const onResize = () => setTopPx((t) => clampTop(t))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // 靠近右边缘且靠近按钮垂直位置时自动露出
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging || drawerVisible) {
        setPeek(true)
        return
      }
      const nearRight = window.innerWidth - e.clientX <= EDGE_PROXIMITY
      const nearY = e.clientY >= topPx - Y_PAD && e.clientY <= topPx + FAB_HEIGHT + Y_PAD
      setPeek(nearRight && nearY)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [dragging, drawerVisible, topPx])

  useEffect(() => {
    if (drawerVisible) {
      form.setFieldsValue(readFormFromApp())
      setPeek(true)
    }
  }, [drawerVisible, form])

  const onPointerMove = useCallback((e: PointerEvent) => {
    const d = dragRef.current
    if (d.pointerId !== e.pointerId) return
    const dy = e.clientY - d.startY
    if (Math.abs(dy) > DRAG_THRESHOLD) d.moved = true
    setTopPx(clampTop(d.startTop + dy))
  }, [])

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      const d = dragRef.current
      if (d.pointerId !== e.pointerId) return
      d.pointerId = null
      setDragging(false)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      setTopPx((t) => {
        persistTop(t)
        return t
      })
      if (!d.moved) {
        openDrawer()
      }
    },
    [onPointerMove, openDrawer, persistTop],
  )

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return
    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startTop: topPx,
      moved: false,
    }
    setDragging(true)
    setPeek(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  async function onSave(values: PrefForm) {
    setSaving(true)
    try {
      await save({
        layout: { mode: values.layoutMode },
        dialog: { maxHeight: (values.dialogMaxHeight || '').trim() || '80vh' },
        tagsView: { height: toPx(values.tagsViewHeight, 40) },
        fontSize: {
          sidebar: toPx(values.sidebar, 14),
          header: toPx(values.header, 14),
          tagsView: toPx(values.tagsView, 14),
          main: toPx(values.main, 14),
        },
      })
      message.success('个人布局已保存')
      closeDrawer()
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function onReset() {
    setResetting(true)
    try {
      await reset()
      form.setFieldsValue(readFormFromApp())
      message.success('已恢复为通用配置')
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '重置失败')
    } finally {
      setResetting(false)
    }
  }

  const fabClass = [
    'ui-pref-fab',
    dragging ? 'is-dragging' : '',
    drawerVisible ? 'is-open' : '',
    peek ? 'is-peek' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <button
        type="button"
        className={fabClass}
        style={{
          top: topPx,
          background: primary,
          boxShadow: `-2px 2px 10px color-mix(in srgb, ${primary} 40%, transparent)`,
        }}
        title="界面偏好（可上下拖动，平时半隐）"
        aria-label="界面偏好"
        onPointerDown={onPointerDown}
      >
        <SettingOutlined />
      </button>

      <Drawer
        title="界面偏好"
        open={drawerVisible}
        onClose={closeDrawer}
        size={420}
        destroyOnHidden
        footer={
          <div className="ui-pref-footer">
            <Space>
              <Button loading={resetting} onClick={() => void onReset()}>
                恢复通用
              </Button>
              <Button type="primary" loading={saving} onClick={() => form.submit()}>
                保存
              </Button>
            </Space>
          </div>
        }
      >
        <p className="ui-pref-hint">
          自定义本账号的布局模式、系统字号与标签栏高度；未设置的项沿用管理员通用配置。
        </p>
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ flex: '100px' }}
          wrapperCol={{ flex: 1 }}
          className="ui-pref-form"
          onFinish={(v) => void onSave(v)}
        >
          <Form.Item name="layoutMode" label="布局模式">
            <Radio.Group
              optionType="button"
              options={[
                { label: '左侧', value: 'side' },
                { label: '顶部', value: 'top' },
                { label: '混合', value: 'mix' },
                { label: '双列', value: 'columns' },
              ]}
            />
          </Form.Item>
          <Form.Item name="dialogMaxHeight" label="弹窗最大高度">
            <Input placeholder="如 95vh" />
          </Form.Item>
          <Form.Item label="标签栏高度">
            <Form.Item name="tagsViewHeight" noStyle>
              <PxInputNumber max={120} />
            </Form.Item>
          </Form.Item>
          <Form.Item label="侧栏字号">
            <Form.Item name="sidebar" noStyle>
              <PxInputNumber max={48} />
            </Form.Item>
          </Form.Item>
          <Form.Item label="顶栏字号">
            <Form.Item name="header" noStyle>
              <PxInputNumber max={48} />
            </Form.Item>
          </Form.Item>
          <Form.Item label="标签栏字号">
            <Form.Item name="tagsView" noStyle>
              <PxInputNumber max={48} />
            </Form.Item>
          </Form.Item>
          <Form.Item label="正文字号">
            <Form.Item name="main" noStyle>
              <PxInputNumber max={48} />
            </Form.Item>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  )
}
