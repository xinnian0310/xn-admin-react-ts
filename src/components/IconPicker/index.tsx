import { Input, Space } from 'antd'
import XnAppIcon from '@/components/XnAppIcon'
import { ICONIFY_PRESETS } from '@/utils/icons'

interface IconPickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

export default function IconPicker({
  value,
  onChange,
  placeholder = '图标名，如 mdi:home 或 Setting',
}: IconPickerProps) {
  return (
    <div>
      <Input
        value={value}
        placeholder={placeholder}
        prefix={value ? <XnAppIcon name={value} size={16} /> : undefined}
        onChange={(e) => onChange?.(e.target.value)}
        allowClear
      />
      <Space wrap size={[6, 6]} style={{ marginTop: 8 }}>
        {ICONIFY_PRESETS.slice(0, 18).map((icon) => (
          <button
            key={icon}
            type="button"
            title={icon}
            onClick={() => onChange?.(icon)}
            style={{
              width: 32,
              height: 32,
              border: value === icon ? '1px solid var(--app-color-primary)' : '1px solid #e5e7eb',
              borderRadius: 6,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <XnAppIcon name={icon} size={16} />
          </button>
        ))}
      </Space>
    </div>
  )
}
