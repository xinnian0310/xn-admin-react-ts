import { useEffect, useState } from 'react'
import { ColorPicker, Tabs, Upload, Button, message, type UploadProps } from 'antd'
import {
  CheckOutlined,
  DeleteOutlined,
  MoonOutlined,
  PictureOutlined,
  SunOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { MAIN_BG_MAX_BYTES, useThemeStore } from '@/stores/theme'
import type { AppearanceMode, CustomThemeParts } from '@/config/themes'
import './themePicker.scss'
import XnModal from '@/components/XnModal'

const CUSTOM_FIELDS: { key: keyof CustomThemeParts; label: string }[] = [
  { key: 'primary', label: '主色' },
  { key: 'sidebarBg', label: '侧栏背景' },
  { key: 'headerBg', label: '顶栏背景' },
]

export default function XnThemePicker() {
  const visible = useThemeStore((s) => s.dialogVisible)
  const closeDialog = useThemeStore((s) => s.closeDialog)
  const themes = useThemeStore((s) => s.themes)
  const themeId = useThemeStore((s) => s.themeId)
  const appearance = useThemeStore((s) => s.appearance)
  const source = useThemeStore((s) => s.source)
  const customParts = useThemeStore((s) => s.customParts)
  const mainBgImage = useThemeStore((s) => s.mainBgImage)
  const setTheme = useThemeStore((s) => s.setTheme)
  const setAppearance = useThemeStore((s) => s.setAppearance)
  const setCustomParts = useThemeStore((s) => s.setCustomParts)
  const setMainBgImage = useThemeStore((s) => s.setMainBgImage)
  const applyCustom = useThemeStore((s) => s.applyCustom)

  const [activeTab, setActiveTab] = useState<string>(source)

  useEffect(() => {
    if (visible) setActiveTab(source)
  }, [visible, source])

  const onBgFile: UploadProps['beforeUpload'] = (file) => {
    if (!file.type.startsWith('image/')) {
      message.warning('请选择图片文件')
      return Upload.LIST_IGNORE
    }
    if (file.size > MAIN_BG_MAX_BYTES) {
      message.warning('图片过大，请压缩到 800KB 以内')
      return Upload.LIST_IGNORE
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        setMainBgImage(String(reader.result))
      } catch (e) {
        message.error(e instanceof Error ? e.message : '保存底图失败')
      }
    }
    reader.readAsDataURL(file)
    return false
  }

  const clearBg = () => {
    try {
      setMainBgImage(null)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '清除失败')
    }
  }

  return (
    <XnModal
      title="主题设置"
      open={visible}
      onCancel={closeDialog}
      footer={null}
      width={640}
      destroyOnHidden
      className="theme-picker-modal"
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="theme-tabs"
        items={[
          {
            key: 'preset',
            label: '预设主题',
            children: (
              <>
                <p className="theme-tab__hint">
                  独立完整主题：一键切换侧栏、顶栏、主色与页面配色。
                </p>
                <div className="theme-dialog__grid">
                  {themes.map((t) => {
                    const active = source === 'preset' && themeId === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`theme-card${active ? ' is-active' : ''}`}
                        onClick={() => setTheme(t.id)}
                      >
                        <div className="theme-card__swatches">
                          <span
                            className="theme-card__swatch"
                            style={{ background: t.swatches[0] }}
                          />
                          <span
                            className="theme-card__swatch"
                            style={{ background: t.colors.primary }}
                          />
                        </div>
                        <div className="theme-card__name">{t.name}</div>
                        {active ? <CheckOutlined className="theme-card__check" /> : null}
                      </button>
                    )
                  })}
                </div>
              </>
            ),
          },
          {
            key: 'appearance',
            label: '外观模式',
            children: (
              <>
                <p className="theme-tab__hint">
                  独立完整主题：亮色 / 暗色整站切换（侧栏、顶栏、内容区一并修改）。
                </p>
                <div className="theme-mode">
                  {(
                    [
                      { mode: 'light' as AppearanceMode, label: '亮色', Icon: SunOutlined },
                      { mode: 'dark' as AppearanceMode, label: '暗色', Icon: MoonOutlined },
                    ] as const
                  ).map(({ mode, label, Icon }) => {
                    const active = source === 'appearance' && appearance === mode
                    return (
                      <button
                        key={mode}
                        type="button"
                        className={`theme-mode__card${active ? ' is-active' : ''}`}
                        onClick={() => setAppearance(mode)}
                      >
                        <div className={`theme-mode__preview theme-mode__preview--${mode}`}>
                          <span className="theme-mode__preview-side" />
                          <span className="theme-mode__preview-main">
                            <span className="theme-mode__preview-bar" />
                            <span className="theme-mode__preview-body" />
                          </span>
                        </div>
                        <div className="theme-mode__meta">
                          <Icon />
                          <span>{label}</span>
                        </div>
                        {active ? <CheckOutlined className="theme-card__check" /> : null}
                      </button>
                    )
                  })}
                </div>
              </>
            ),
          },
          {
            key: 'custom',
            label: '个性化',
            children: (
              <>
                <p className="theme-tab__hint">
                  独立完整主题：自定义颜色与内容区底图，保存后整站应用。
                </p>

                <div className="theme-custom-preview">
                  <div
                    className="theme-custom-preview__shell"
                    style={{
                      ['--preview-sidebar' as string]: customParts.sidebarBg,
                      ['--preview-header' as string]: customParts.headerBg,
                      ['--preview-primary' as string]: customParts.primary,
                      backgroundImage: mainBgImage ? `url(${mainBgImage})` : undefined,
                    }}
                  >
                    <span className="theme-custom-preview__side" />
                    <span className="theme-custom-preview__main">
                      <span className="theme-custom-preview__bar" />
                      <span className="theme-custom-preview__body">
                        <span className="theme-custom-preview__accent" />
                      </span>
                    </span>
                  </div>
                  <div className="theme-custom-preview__caption">实时预览</div>
                </div>

                <div className="theme-custom">
                  {CUSTOM_FIELDS.map((item) => (
                    <label key={item.key} className="theme-custom__row">
                      <span className="theme-custom__meta">
                        <span className="theme-custom__name">{item.label}</span>
                        <span className="theme-custom__hex">{customParts[item.key]}</span>
                      </span>
                      <ColorPicker
                        value={customParts[item.key]}
                        onChange={(_, hex) => setCustomParts({ [item.key]: hex })}
                        size="small"
                      />
                    </label>
                  ))}
                </div>

                <div className="theme-bg">
                  <div className="theme-bg__head">
                    <div className="theme-bg__label">内容区底图</div>
                    <span className="theme-bg__hint">PNG / JPG / WebP · ≤ 800KB</span>
                  </div>

                  {mainBgImage ? (
                    <div className="theme-bg__filled">
                      <div
                        className="theme-bg__image"
                        style={{ backgroundImage: `url(${mainBgImage})` }}
                      />
                      <div className="theme-bg__toolbar">
                        <Upload
                          showUploadList={false}
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          beforeUpload={onBgFile}
                        >
                          <Button type="primary" size="small" icon={<UploadOutlined />}>
                            更换图片
                          </Button>
                        </Upload>
                        <Button size="small" icon={<DeleteOutlined />} onClick={clearBg}>
                          清除
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Upload.Dragger
                      className="theme-bg__upload"
                      showUploadList={false}
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      beforeUpload={onBgFile}
                    >
                      <div className="theme-bg__empty">
                        <span className="theme-bg__icon">
                          <PictureOutlined />
                        </span>
                        <span className="theme-bg__title">点击或拖拽上传底图</span>
                        <span className="theme-bg__desc">仅本地保存，不会上传到服务器</span>
                      </div>
                    </Upload.Dragger>
                  )}

                  <p className="theme-bg__tip">修改颜色或底图会自动切换到个性化主题。</p>

                  {source !== 'custom' ? (
                    <button type="button" className="theme-custom__apply" onClick={applyCustom}>
                      应用个性化
                    </button>
                  ) : null}
                </div>
              </>
            ),
          },
        ]}
      />
    </XnModal>
  )
}

