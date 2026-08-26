import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import { Avatar, Button, message } from 'antd'
import XnDialog from '@/components/XnDialog'
import { showCaughtError } from '@/utils/request'
import './xnAvatarCrop.scss'

export type XnAvatarCropProps = {
  value?: string
  onChange?: (value: string) => void
  size?: number
  fallback?: string
  disabled?: boolean
  /** 自定义上传，返回可访问 URL；不传则用本地 blob */
  request?: (file: File) => Promise<string>
}

export default function XnAvatarCrop({
  value = '',
  onChange,
  size = 88,
  fallback = '头像',
  disabled = false,
  request,
}: XnAvatarCropProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const scaleRef = useRef(1)
  const offsetRef = useRef({ x: 0, y: 0 })
  const draggingRef = useRef(false)
  const lastRef = useRef({ x: 0, y: 0 })
  const [, setTick] = useState(0)

  function draw() {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, 360, 360)
    ctx.fillStyle = '#1d1d1d'
    ctx.fillRect(0, 0, 360, 360)
    const w = img.width * scaleRef.current
    const h = img.height * scaleRef.current
    ctx.drawImage(img, 180 - w / 2 + offsetRef.current.x, 180 - h / 2 + offsetRef.current.y, w, h)
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, 358, 358)
  }

  useEffect(() => {
    if (open) {
      const id = window.requestAnimationFrame(draw)
      return () => window.cancelAnimationFrame(id)
    }
  }, [open])

  function pick() {
    if (disabled) return
    inputRef.current?.click()
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      scaleRef.current = Math.max(360 / img.width, 360 / img.height)
      offsetRef.current = { x: 0, y: 0 }
      setOpen(true)
      setTick((n) => n + 1)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  function onWheel(event: ReactWheelEvent) {
    event.preventDefault()
    scaleRef.current = Math.min(
      4,
      Math.max(0.2, scaleRef.current * (event.deltaY > 0 ? 0.92 : 1.08)),
    )
    draw()
  }

  function onDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    draggingRef.current = true
    lastRef.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!draggingRef.current) return
    offsetRef.current = {
      x: offsetRef.current.x + event.clientX - lastRef.current.x,
      y: offsetRef.current.y + event.clientY - lastRef.current.y,
    }
    lastRef.current = { x: event.clientX, y: event.clientY }
    draw()
  }

  function onUp() {
    draggingRef.current = false
  }

  async function confirm() {
    const canvas = canvasRef.current
    if (!canvas) return
    setSubmitting(true)
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((item) => (item ? resolve(item) : reject(new Error('裁剪失败'))), 'image/png')
      })
      const file = new File([blob], 'avatar.png', { type: 'image/png' })
      const url = request ? await request(file) : URL.createObjectURL(blob)
      onChange?.(url)
      setOpen(false)
      message.success('已裁剪')
    } catch (error) {
      showCaughtError(error, '裁剪失败')
    } finally {
      setSubmitting(false)
    }
  }

  function clear() {
    onChange?.('')
  }

  return (
    <div className="xn-avatar-crop">
      <Avatar size={size} src={value || undefined}>
        {fallback}
      </Avatar>
      <div className="xn-avatar-crop__actions">
        <Button size="small" disabled={disabled} onClick={pick}>
          选择图片
        </Button>
        {value && !disabled ? (
          <Button size="small" type="link" danger onClick={clear}>
            清除
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        hidden
        onChange={onFile}
      />

      <XnDialog
        open={open}
        title="裁剪头像"
        width={480}
        confirmText="确定"
        confirmLoading={submitting}
        onCancel={() => setOpen(false)}
        onConfirm={() => void confirm()}
      >
        <div className="xn-avatar-crop__stage" onWheel={onWheel}>
          <canvas
            ref={canvasRef}
            width={360}
            height={360}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
          />
        </div>
        <div className="xn-avatar-crop__hint">滚轮缩放，拖拽调整位置</div>
      </XnDialog>
    </div>
  )
}
