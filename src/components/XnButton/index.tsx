import { Dropdown, Button, Space, message } from 'antd'
import type { MenuProps } from 'antd'
import type { ButtonListItem } from '@/types/button'
import { resolveButtonAction } from '@/utils/page-ui'
import { usePermission } from '@/hooks/usePermission'
import XnAppIcon from '@/components/XnAppIcon'

const COLOR_MAP: Record<string, 'primary' | 'default' | 'dashed' | 'link' | 'text'> = {
  primary: 'primary',
  success: 'primary',
  warning: 'default',
  danger: 'primary',
  info: 'default',
  default: 'default',
}

interface XnButtonProps {
  listItem?: ButtonListItem[]
  selected?: unknown[]
  onButtonClick?: (action: string, item: ButtonListItem) => void
}

export default function XnButton({ listItem = [], selected = [], onButtonClick }: XnButtonProps) {
  const { hasPermission } = usePermission()

  const visible = listItem.filter((item) => !item.permission || hasPermission(item.permission))

  function isDisabled(item: ButtonListItem) {
    if (item.disabled) return true
    if (item.index === 0 && selected.length !== 1) return true
    if (typeof item.index === 'number' && item.index > 0 && selected.length < item.index) return true
    return false
  }

  function handleClick(item: ButtonListItem) {
    if (isDisabled(item)) {
      if (item.index === 0) message.warning('请选择一项操作')
      return
    }
    onButtonClick?.(resolveButtonAction(item), item)
  }

  return (
    <Space wrap>
      {visible.map((item) => {
        if (item.type === 'down' && item.searchItem?.length) {
          const items: MenuProps['items'] = item.searchItem
            .filter((sub) => !sub.permission || hasPermission(sub.permission))
            .map((sub) => ({
              key: sub.action || sub.name,
              label: sub.name,
              icon: sub.icon ? <XnAppIcon name={sub.icon} size={14} /> : undefined,
              onClick: () =>
                onButtonClick?.(sub.action || sub.name, {
                  ...item,
                  action: sub.action || sub.name,
                  name: sub.name,
                }),
            }))
          return (
            <Dropdown key={item.name} menu={{ items }} disabled={isDisabled(item)}>
              <Button
                type={COLOR_MAP[item.typeColor || 'default'] || 'default'}
                danger={item.typeColor === 'danger'}
                icon={item.icon ? <XnAppIcon name={item.icon} size={14} /> : undefined}
              >
                {item.name}
              </Button>
            </Dropdown>
          )
        }

        return (
          <Button
            key={item.name + (item.action || '')}
            type={COLOR_MAP[item.typeColor || 'default'] || 'default'}
            danger={item.typeColor === 'danger'}
            disabled={isDisabled(item)}
            icon={item.icon ? <XnAppIcon name={item.icon} size={14} /> : undefined}
            onClick={() => handleClick(item)}
          >
            {item.name}
          </Button>
        )
      })}
    </Space>
  )
}

interface XnTableActionsProps {
  items?: ButtonListItem[]
  row: Record<string, unknown>
  disabled?: (action: string, row: Record<string, unknown>) => boolean | string
  onActionClick?: (payload: { action: string; row: Record<string, unknown> }) => void
}

export function XnTableActions({
  items = [],
  row,
  disabled,
  onActionClick,
}: XnTableActionsProps) {
  const { hasPermission } = usePermission()
  const visible = items.filter((item) => !item.permission || hasPermission(item.permission))

  return (
    <Space size={4} wrap>
      {visible.map((item) => {
        const action = resolveButtonAction(item)
        const reason = disabled?.(action, row)
        const isDisabled = Boolean(reason)
        return (
          <Button
            key={action}
            type="link"
            size="small"
            danger={item.typeColor === 'danger'}
            disabled={isDisabled}
            title={typeof reason === 'string' ? reason : undefined}
            onClick={() => onActionClick?.({ action, row })}
          >
            {item.name}
          </Button>
        )
      })}
    </Space>
  )
}
