import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { Modal } from 'antd'
import type { ModalFuncProps, ModalProps } from 'antd'
import { appConfig, subscribeAppConfig } from '@/config/app'
import './xnModal.scss'

export type XnModalProps = ModalProps & {
  /** 覆盖全局拖拽；不传则读 appConfig.ui.antd.modal.draggable */
  draggable?: boolean
}

type XnModalComponent = ((props: XnModalProps) => ReactElement) & {
  info: typeof Modal.info
  success: typeof Modal.success
  error: typeof Modal.error
  warning: typeof Modal.warning
  confirm: typeof Modal.confirm
  destroyAll: typeof Modal.destroyAll
  config: typeof Modal.config
  useModal: typeof Modal.useModal
  displayName?: string
}

type ModalStyles = Exclude<
  ModalProps['styles'],
  ((info: { props: ModalProps }) => unknown) | undefined
>

function resolveModalStyles(
  styles: ModalProps['styles'],
  info: { props: ModalProps },
): ModalStyles {
  if (!styles) return {}
  if (typeof styles === 'function') return styles(info) ?? {}
  return styles
}

function useAppConfigTick() {
  const [, setTick] = useState(0)
  useEffect(() => subscribeAppConfig(() => setTick((n) => n + 1)), [])
}

function resolveMask(
  mask: ModalProps['mask'],
  maskClosable: ModalProps['maskClosable'],
): ModalProps['mask'] {
  if (mask === false) return false
  const closable =
    typeof mask === 'object' && mask && 'closable' in mask ? mask.closable : maskClosable
  if (typeof mask === 'object' && mask) {
    return closable === undefined ? mask : { ...mask, closable }
  }
  if (closable === undefined) return mask
  return { closable }
}

function XnModalInner({
  draggable: draggableProp,
  centered,
  open,
  modalRender,
  className,
  style,
  styles: stylesProp,
  afterOpenChange,
  destroyOnClose,
  destroyOnHidden,
  maskClosable,
  mask,
  ...rest
}: XnModalProps) {
  useAppConfigTick()

  const draggable = draggableProp ?? appConfig.ui.antd.modal.draggable
  const resolvedCentered = centered ?? appConfig.ui.antd.modal.centered
  const resolvedDestroyOnHidden = destroyOnHidden ?? destroyOnClose
  const resolvedMask = resolveMask(mask, maskClosable)
  const maxHeight = appConfig.ui.dialog.maxHeight || appConfig.ui.antd.modal.maxHeight || '80vh'

  const [offset, setOffsetState] = useState({ x: 0, y: 0 })
  const offsetRef = useRef({ x: 0, y: 0 })
  const draggingRef = useRef(false)

  const setOffset = useCallback((next: { x: number; y: number }) => {
    offsetRef.current = next
    setOffsetState(next)
  }, [])

  const onHeaderMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      if (!draggable) return
      const target = e.target as HTMLElement
      if (!target.closest('.ant-modal-header')) return
      if (target.closest('.ant-modal-close, button, a, input, textarea')) return

      e.preventDefault()
      draggingRef.current = true
      const startX = e.clientX
      const startY = e.clientY
      const orig = offsetRef.current

      const onMove = (ev: MouseEvent) => {
        if (!draggingRef.current) return
        const next = { x: orig.x + ev.clientX - startX, y: orig.y + ev.clientY - startY }
        offsetRef.current = next
        setOffset(next)
      }
      const onUp = () => {
        draggingRef.current = false
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [draggable, setOffset],
  )

  const renderModal = useCallback(
    (node: ReactNode) => {
      const inner = modalRender ? modalRender(node) : node
      if (!draggable) return inner
      return (
        <div className="xn-modal-drag-root" onMouseDown={onHeaderMouseDown}>
          {inner}
        </div>
      )
    },
    [draggable, modalRender, onHeaderMouseDown],
  )

  return (
    <Modal
      {...rest}
      open={open}
      centered={resolvedCentered}
      mask={resolvedMask}
      destroyOnHidden={resolvedDestroyOnHidden}
      className={['xn-modal', draggable ? 'xn-modal--draggable' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        ...(draggable ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : {}),
      }}
      styles={(info) => {
        const resolved = resolveModalStyles(stylesProp, info)
        return {
          ...resolved,
          wrapper: { overflow: 'visible', ...resolved.wrapper },
          container: {
            ...resolved.container,
            maxHeight: resolved.container?.maxHeight ?? maxHeight,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
          header: { flexShrink: 0, ...resolved.header },
          body: {
            ...resolved.body,
            flex: '1 1 auto',
            minHeight: 0,
            overflowX: 'hidden',
            overflowY: 'auto',
          },
          footer: { flexShrink: 0, ...resolved.footer },
        }
      }}
      modalRender={renderModal}
      afterOpenChange={(v) => {
        if (!v) {
          setOffset({ x: 0, y: 0 })
          offsetRef.current = { x: 0, y: 0 }
        }
        afterOpenChange?.(v)
      }}
    />
  )
}

function withModalDefaults(fn: (props: ModalFuncProps) => ReturnType<typeof Modal.info>) {
  return (props: ModalFuncProps) => {
    const { maskClosable, mask, ...rest } = props
    return fn({
      centered: appConfig.ui.antd.modal.centered,
      ...rest,
      mask: resolveMask(mask, maskClosable),
    })
  }
}

const XnModal = XnModalInner as XnModalComponent
XnModal.displayName = 'XnModal'
XnModal.info = withModalDefaults(Modal.info)
XnModal.success = withModalDefaults(Modal.success)
XnModal.error = withModalDefaults(Modal.error)
XnModal.warning = withModalDefaults(Modal.warning)
XnModal.confirm = withModalDefaults(Modal.confirm)
XnModal.destroyAll = Modal.destroyAll
XnModal.config = Modal.config
XnModal.useModal = Modal.useModal

export default XnModal
