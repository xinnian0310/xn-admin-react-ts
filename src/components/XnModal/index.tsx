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

function useAppConfigTick() {
  const [, setTick] = useState(0)
  useEffect(() => subscribeAppConfig(() => setTick((n) => n + 1)), [])
}

function XnModalInner({
  draggable: draggableProp,
  centered,
  open,
  modalRender,
  className,
  styles: stylesProp,
  afterOpenChange,
  destroyOnClose,
  destroyOnHidden,
  ...rest
}: XnModalProps) {
  useAppConfigTick()

  const draggable = draggableProp ?? appConfig.ui.antd.modal.draggable
  const resolvedCentered = centered ?? appConfig.ui.antd.modal.centered
  const resolvedDestroyOnHidden = destroyOnHidden ?? destroyOnClose
  const maxHeight =
    appConfig.ui.dialog.maxHeight || appConfig.ui.antd.modal.maxHeight || '80vh'

  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const offsetRef = useRef(offset)
  offsetRef.current = offset
  const draggingRef = useRef(false)

  useEffect(() => {
    if (!open) {
      setOffset({ x: 0, y: 0 })
      offsetRef.current = { x: 0, y: 0 }
    }
  }, [open])

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
    [draggable],
  )

  const renderModal = useCallback(
    (node: ReactNode) => {
      const inner = modalRender ? modalRender(node) : node
      if (!draggable) return inner
      return (
        <div
          className="xn-modal-drag-root"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
          onMouseDown={onHeaderMouseDown}
        >
          {inner}
        </div>
      )
    },
    [draggable, modalRender, offset.x, offset.y, onHeaderMouseDown],
  )

  return (
    <Modal
      {...rest}
      open={open}
      centered={resolvedCentered}
      destroyOnHidden={resolvedDestroyOnHidden}
      className={['xn-modal', draggable ? 'xn-modal--draggable' : '', className]
        .filter(Boolean)
        .join(' ')}
      styles={{
        ...stylesProp,
        wrapper: { overflow: 'hidden', ...stylesProp?.wrapper },
        container: {
          ...stylesProp?.container,
          maxHeight,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
        header: { flexShrink: 0, ...stylesProp?.header },
        body: {
          ...stylesProp?.body,
          flex: '1 1 auto',
          minHeight: 0,
          overflowX: 'hidden',
          overflowY: 'auto',
        },
        footer: { flexShrink: 0, ...stylesProp?.footer },
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
  return (props: ModalFuncProps) =>
    fn({
      centered: appConfig.ui.antd.modal.centered,
      ...props,
    })
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
