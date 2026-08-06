import { Modal, ColorPicker, Space, Button, Radio } from 'antd'
import { useThemeStore } from '@/stores/theme'
import type { AppearanceMode } from '@/config/themes'

export default function ThemePicker() {
  const visible = useThemeStore((s) => s.dialogVisible)
  const closeDialog = useThemeStore((s) => s.closeDialog)
  const themes = useThemeStore((s) => s.themes)
  const themeId = useThemeStore((s) => s.themeId)
  const appearance = useThemeStore((s) => s.appearance)
  const source = useThemeStore((s) => s.source)
  const customParts = useThemeStore((s) => s.customParts)
  const setTheme = useThemeStore((s) => s.setTheme)
  const setAppearance = useThemeStore((s) => s.setAppearance)
  const setCustomParts = useThemeStore((s) => s.setCustomParts)

  return (
    <Modal title="主题设置" open={visible} onCancel={closeDialog} footer={null} width={560}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>预设主题</div>
          <Space wrap>
            {themes.map((t) => (
              <Button
                key={t.id}
                type={source === 'preset' && themeId === t.id ? 'primary' : 'default'}
                onClick={() => setTheme(t.id)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${t.swatches[0]} 50%, ${t.swatches[1]} 50%)`,
                    border: '1px solid rgba(0,0,0,0.08)',
                  }}
                />
                {t.name}
              </Button>
            ))}
          </Space>
        </div>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>外观模式</div>
          <Radio.Group
            value={source === 'appearance' ? appearance : undefined}
            onChange={(e) => setAppearance(e.target.value as AppearanceMode)}
            optionType="button"
            options={[
              { label: '亮色', value: 'light' },
              { label: '暗色', value: 'dark' },
            ]}
          />
        </div>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>个性化</div>
          <Space wrap size="large">
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, opacity: 0.65 }}>主色</div>
              <ColorPicker
                value={customParts.primary}
                onChange={(_, hex) => setCustomParts({ primary: hex })}
                showText
              />
            </div>
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, opacity: 0.65 }}>侧栏</div>
              <ColorPicker
                value={customParts.sidebarBg}
                onChange={(_, hex) => setCustomParts({ sidebarBg: hex })}
                showText
              />
            </div>
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, opacity: 0.65 }}>顶栏</div>
              <ColorPicker
                value={customParts.headerBg}
                onChange={(_, hex) => setCustomParts({ headerBg: hex })}
                showText
              />
            </div>
          </Space>
        </div>
      </Space>
    </Modal>
  )
}
