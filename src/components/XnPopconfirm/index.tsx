import type { ReactNode } from 'react'
import { Popconfirm } from 'antd'
import type { PopconfirmProps } from 'antd'

export type XnPopconfirmProps = {
  title?: ReactNode
  width?: number
  confirmText?: string
  cancelText?: string
  disabled?: boolean
  children?: ReactNode
  onConfirm?: () => void
  onCancel?: () => void
  okButtonProps?: PopconfirmProps['okButtonProps']
}

export default function XnPopconfirm({
  title = '确定执行该操作吗？',
  confirmText = '确定',
  cancelText = '取消',
  disabled = false,
  children,
  onConfirm,
  onCancel,
  okButtonProps,
}: XnPopconfirmProps) {
  function handleConfirm() {
    if (disabled) return
    onConfirm?.()
  }

  return (
    <Popconfirm
      title={title}
      okText={confirmText}
      cancelText={cancelText}
      disabled={disabled}
      okButtonProps={{ danger: true, ...okButtonProps }}
      onConfirm={handleConfirm}
      onCancel={onCancel}
    >
      {children}
    </Popconfirm>
  )
}
