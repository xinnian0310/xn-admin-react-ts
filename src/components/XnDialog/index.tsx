import { useState, type ReactNode } from 'react'
import { Button, Spin } from 'antd'
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons'
import XnModal from '@/components/XnModal'
import './xnDialog.scss'

const SIZE_WIDTH = { small: 420, default: 560, large: 720 } as const

export type XnDialogSize = keyof typeof SIZE_WIDTH

export type XnDialogProps = {
  open: boolean
  onCancel?: () => void
  title?: ReactNode
  confirmLoading?: boolean
  onConfirm?: () => void
  children?: ReactNode
  /** 传入则覆盖默认取消 / 确定；`null` 隐藏页脚 */
  footer?: ReactNode
  size?: XnDialogSize
  width?: string | number
  fullscreen?: boolean
  /** 标题栏全屏切换 */
  showFullscreen?: boolean
  /** 内容区遮罩，详情拉取时用 */
  loading?: boolean
  destroyOnClose?: boolean
  showFooter?: boolean
  showCancel?: boolean
  showConfirm?: boolean
  cancelText?: string
  confirmText?: string
  confirmDisabled?: boolean
  afterClose?: () => void
  closable?: boolean
  maskClosable?: boolean
  keyboard?: boolean
  centered?: boolean
  draggable?: boolean
  className?: string
}

export default function XnDialog({
  open,
  onCancel,
  title = '',
  confirmLoading = false,
  onConfirm,
  children,
  footer,
  size = 'default',
  width,
  fullscreen = false,
  showFullscreen = false,
  loading = false,
  destroyOnClose = true,
  showFooter = true,
  showCancel = true,
  showConfirm = true,
  cancelText = '取消',
  confirmText = '确定',
  confirmDisabled = false,
  afterClose,
  closable = true,
  maskClosable = false,
  keyboard = true,
  centered,
  draggable,
  className,
}: XnDialogProps) {
  const [innerFullscreen, setInnerFullscreen] = useState(fullscreen)
  const [prevFullscreen, setPrevFullscreen] = useState(fullscreen)
  const [prevOpen, setPrevOpen] = useState(open)

  if (fullscreen !== prevFullscreen) {
    setPrevFullscreen(fullscreen)
    setInnerFullscreen(fullscreen)
  }
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open) setInnerFullscreen(fullscreen)
  }

  function handleCancel() {
    onCancel?.()
  }

  function toggleFullscreen() {
    setInnerFullscreen((prev) => !prev)
  }

  const resolvedFooter =
    footer !== undefined ? (
      footer
    ) : showFooter ? (
      <>
        {showCancel ? <Button onClick={handleCancel}>{cancelText}</Button> : null}
        {showConfirm ? (
          <Button
            type="primary"
            loading={confirmLoading}
            disabled={confirmDisabled}
            onClick={() => onConfirm?.()}
          >
            {confirmText}
          </Button>
        ) : null}
      </>
    ) : null

  const resolvedWidth = width ?? SIZE_WIDTH[size]
  const resolvedTitle = showFullscreen ? (
    <div className="xn-dialog__header">
      <span className="xn-dialog__title">{title}</span>
      <button
        type="button"
        className="xn-dialog__full"
        title={innerFullscreen ? '退出全屏' : '全屏'}
        onClick={toggleFullscreen}
      >
        {innerFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
      </button>
    </div>
  ) : (
    title
  )

  return (
    <XnModal
      className={['xn-dialog', innerFullscreen ? 'is-full' : '', className]
        .filter(Boolean)
        .join(' ')}
      title={resolvedTitle}
      open={open}
      width={innerFullscreen ? '100%' : resolvedWidth}
      style={innerFullscreen ? { top: 0, maxWidth: '100%' } : undefined}
      styles={innerFullscreen ? { container: { maxHeight: '100vh' } } : undefined}
      onCancel={handleCancel}
      footer={resolvedFooter}
      confirmLoading={confirmLoading}
      destroyOnClose={destroyOnClose}
      afterClose={afterClose}
      closable={closable}
      maskClosable={maskClosable}
      keyboard={keyboard}
      centered={innerFullscreen ? false : centered}
      draggable={innerFullscreen ? false : draggable}
    >
      <Spin spinning={loading}>{children}</Spin>
    </XnModal>
  )
}
