import { Dropdown, Button, Space, message } from 'antd'
import type { MenuProps } from 'antd'
import type { ButtonListItem } from '@/types/button'
import { resolveButtonAction } from '@/utils/page-ui'
import { usePermission } from '@/hooks/usePermission'
import XnAppIcon from '@/components/XnAppIcon'
import XnExport from '@/components/XnExport'
import XnPopconfirm from '@/components/XnPopconfirm'
import './xnButton.scss'

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
  /** 传入后工具栏「导出」直接走 XnExport，不再 onButtonClick */
  exportRequest?: () => Promise<void>
}

export default function XnButton({
  listItem = [],
  selected = [],
  onButtonClick,
  exportRequest,
}: XnButtonProps) {
  const { hasPermission } = usePermission()

  const visible = listItem.filter((item) => !item.permission || hasPermission(item.permission))

  function isDisabled(item: ButtonListItem) {
    if (item.disabled) return true
    // index 表示「需要选中的行数 - 1」；后端未配置时可能下发 null，不能当成 0
    if (item.index != null) {
      return selected.length !== item.index + 1
    }
    // 删除 / 下发 / 撤回：至少选中 1 条（与 Vue XnButton 对齐）
    const action = resolveButtonAction(item)
    if (action === 'delete' || action === 'publish' || action === 'revoke') {
      return selected.length < 1
    }
    return false
  }

  function handleClick(item: ButtonListItem) {
    if (isDisabled(item)) {
      const action = resolveButtonAction(item)
      if (item.index != null) {
        message.warning(item.index === 0 ? '请选择一项操作' : `请选择 ${item.index + 1} 项操作`)
      } else if (action === 'delete' || action === 'publish' || action === 'revoke') {
        message.warning('请至少选择一项')
      }
      return
    }
    onButtonClick?.(resolveButtonAction(item), item)
  }

  return (
    <Space wrap className="xn-button">
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
                className={
                  !item.typeColor || item.typeColor === 'primary' || item.typeColor === 'success'
                    ? 'xn-button__primary-tone'
                    : undefined
                }
                type={COLOR_MAP[item.typeColor || 'primary'] || 'primary'}
                danger={item.typeColor === 'danger'}
                icon={item.icon ? <XnAppIcon name={item.icon} size={14} /> : undefined}
              >
                {item.name}
              </Button>
            </Dropdown>
          )
        }

        if (item.action === 'export' && exportRequest) {
          const tone = item.typeColor || 'default'
          return (
            <XnExport
              key={item.name + (item.action || '')}
              request={exportRequest}
              text={item.name || '导出'}
              type={tone && tone !== 'default' ? tone : 'primary'}
              plain={tone !== 'success' && tone !== 'warning' && tone !== 'danger'}
              disabled={isDisabled(item)}
            />
          )
        }

        const tone = item.typeColor || 'default'
        const usePrimaryTone = tone === 'primary' || tone === 'success'
        return (
          <Button
            key={item.name + (item.action || '')}
            className={usePrimaryTone ? 'xn-button__primary-tone' : undefined}
            type={COLOR_MAP[tone] || 'default'}
            danger={tone === 'danger'}
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
  /** 需要气泡确认的动作，默认 delete */
  confirmActions?: string[]
  onActionClick?: (payload: { action: string; row: Record<string, unknown> }) => void
}

function rowConfirmName(row: Record<string, unknown>) {
  return row.name || row.title || row.username || row.label || row.path || row.key
}

export function XnTableActions({
  items = [],
  row,
  disabled,
  confirmActions = ['delete'],
  onActionClick,
}: XnTableActionsProps) {
  const { hasPermission } = usePermission()
  const visible = items.filter((item) => !item.permission || hasPermission(item.permission))

  function confirmTitle(item: ButtonListItem) {
    const name = rowConfirmName(row)
    if (name) return `确定${item.name}「${name}」吗？`
    return `确定${item.name}吗？`
  }

  return (
    <Space size={4} wrap={false} className="xn-table-actions" style={{ flexWrap: 'nowrap' }}>
      {visible.map((item) => {
        const action = resolveButtonAction(item)
        const reason = disabled?.(action, row)
        const isDisabled = Boolean(reason)
        const needConfirm = confirmActions.includes(action)
        const button = (
          <Button
            key={action}
            type="link"
            size="small"
            className={item.typeColor === 'danger' ? undefined : 'xn-button__link-tone'}
            danger={item.typeColor === 'danger'}
            disabled={isDisabled}
            title={typeof reason === 'string' ? reason : undefined}
            onClick={needConfirm ? undefined : () => onActionClick?.({ action, row })}
          >
            {item.name}
          </Button>
        )
        if (needConfirm) {
          return (
            <XnPopconfirm
              key={action}
              title={confirmTitle(item)}
              disabled={isDisabled}
              onConfirm={() => onActionClick?.({ action, row })}
            >
              {button}
            </XnPopconfirm>
          )
        }
        return button
      })}
    </Space>
  )
}
