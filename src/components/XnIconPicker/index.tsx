import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Button, Input, Popover, Segmented } from 'antd'
import { CloseCircleOutlined, DownOutlined } from '@ant-design/icons'
import XnAppIcon from '@/components/XnAppIcon'
import {
  ICONIFY_PRESETS,
  buildIconValue,
  listAntdIconNames,
  listSvgIconNames,
  parseIcon,
  type IconType,
} from '@/utils/icons'
import './index.css'

type PickerTab = 'antd' | 'iconify' | 'svg'

interface XnIconPickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

const ANTD_NAMES = listAntdIconNames()
const SVG_NAMES = listSvgIconNames()

function toPickerTab(type?: IconType | null): PickerTab {
  if (type === 'iconify' || type === 'svg' || type === 'antd') return type
  return 'antd'
}

export default function XnIconPicker({
  value = '',
  onChange,
  placeholder = '选择 Ant / Iconify / SVG 图标',
  disabled = false,
}: XnIconPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [iconifyInput, setIconifyInput] = useState('')
  const [activeTab, setActiveTab] = useState<PickerTab>('antd')

  useEffect(() => {
    const parsed = parseIcon(value)
    if (parsed) {
      setActiveTab(toPickerTab(parsed.type))
      if (parsed.type === 'iconify') setIconifyInput(parsed.name)
    }
  }, [value])

  useEffect(() => {
    if (!open) return
    const onDocPointerDown = (event: globalThis.MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('.xn-icon-picker') || target.closest('.xn-icon-picker-popper')) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocPointerDown, true)
    return () => document.removeEventListener('mousedown', onDocPointerDown, true)
  }, [open])

  const searchPlaceholder = useMemo(() => {
    if (activeTab === 'antd') return '搜索 Ant 图标名，如 SettingOutlined'
    if (activeTab === 'iconify') return '筛选预设，如 home / dashboard'
    return '搜索本地 SVG 文件名'
  }, [activeTab])

  const displayList = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    if (activeTab === 'antd') {
      return ANTD_NAMES.filter((name) => !kw || name.toLowerCase().includes(kw))
        .slice(0, 200)
        .map((name) => ({ value: buildIconValue('antd', name), label: name }))
    }
    if (activeTab === 'svg') {
      return SVG_NAMES.filter((name) => !kw || name.toLowerCase().includes(kw)).map((name) => ({
        value: buildIconValue('svg', name),
        label: name,
      }))
    }
    return ICONIFY_PRESETS.filter((name) => !kw || name.toLowerCase().includes(kw)).map((name) => ({
      value: name,
      label: name.includes(':') ? name.split(':')[1] : name,
    }))
  }, [activeTab, keyword])

  const select = (next: string) => {
    onChange?.(next)
    setOpen(false)
  }

  const clear = (e: MouseEvent) => {
    e.stopPropagation()
    onChange?.('')
    setOpen(false)
  }

  const applyIconifyInput = () => {
    const name = iconifyInput.trim()
    if (!name.includes(':')) return
    setActiveTab('iconify')
    select(buildIconValue('iconify', name))
  }

  const panel = (
    <div className="xn-icon-picker__panel" onClick={(e) => e.stopPropagation()}>
      <Segmented
        className="xn-icon-picker__tabs"
        block
        value={activeTab}
        onChange={(v) => setActiveTab(v as PickerTab)}
        options={[
          { label: 'Ant', value: 'antd' },
          { label: 'Iconify', value: 'iconify' },
          { label: 'SVG', value: 'svg' },
        ]}
      />

      <Input
        allowClear
        value={keyword}
        placeholder={searchPlaceholder}
        onChange={(e) => setKeyword(e.target.value)}
      />

      {activeTab === 'iconify' ? (
        <div className="xn-icon-picker__iconify-input">
          <Input
            value={iconifyInput}
            placeholder="输入 Iconify 名称，如 mdi:home，回车选用"
            onChange={(e) => setIconifyInput(e.target.value)}
            onPressEnter={applyIconifyInput}
            addonAfter={
              <Button type="link" size="small" onClick={applyIconifyInput}>
                选用
              </Button>
            }
          />
          <div className="xn-icon-picker__hint">
            可在{' '}
            <a href="https://icon-sets.iconify.design/" target="_blank" rel="noreferrer">
              Iconify
            </a>{' '}
            搜索后粘贴至此
          </div>
        </div>
      ) : null}

      <div className="xn-icon-picker__scroll">
        <div className="xn-icon-picker__grid">
          {displayList.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`xn-icon-picker__item${value === item.value ? ' is-active' : ''}`}
              title={item.value}
              onClick={() => select(item.value)}
            >
              <XnAppIcon name={item.value} size={18} />
              <span className="xn-icon-picker__item-name">{item.label}</span>
            </button>
          ))}
          {!displayList.length ? <div className="xn-icon-picker__empty">暂无匹配图标</div> : null}
        </div>
      </div>
    </div>
  )

  return (
    <div className="xn-icon-picker" ref={rootRef}>
      <Popover
        open={open && !disabled}
        onOpenChange={(next) => {
          if (disabled) return
          setOpen(next)
        }}
        trigger="click"
        placement="bottomLeft"
        arrow={false}
        classNames={{ root: 'xn-icon-picker-popper' }}
        content={panel}
        destroyOnHidden
      >
        <div
          className={`xn-icon-picker__trigger${disabled ? ' is-disabled' : ''}${!value ? ' is-empty' : ''}`}
        >
          {value ? <XnAppIcon name={value} size={16} /> : null}
          <span className="xn-icon-picker__label">{value || placeholder}</span>
          {value && !disabled ? (
            <CloseCircleOutlined className="xn-icon-picker__clear" onClick={clear} />
          ) : (
            <DownOutlined className="xn-icon-picker__arrow" />
          )}
        </div>
      </Popover>
    </div>
  )
}
