import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Input, message } from 'antd'
import { fetchCaptcha, verifySliderCaptcha } from '@/api/auth'
import './xnCaptcha.scss'

export type CaptchaType = 'IMAGE' | 'SLIDER'

export type XnCaptchaHandle = {
  refresh: () => Promise<void>
  getPayload: () => { captchaId: string; captchaCode?: string }
  captchaId: string
}

export type XnCaptchaProps = {
  value?: string
  onChange?: (value: string) => void
  captchaId?: string
  onCaptchaIdChange?: (value: string) => void
  /** auto：请求后端；local：前端生成，演示用不打接口 */
  mode?: 'auto' | 'local'
  type?: CaptchaType
  disabled?: boolean
  onVerified?: (ok: boolean) => void
  onPayloadChange?: (payload: { captchaId: string; captchaCode?: string }) => void
}

const XnCaptcha = forwardRef<XnCaptchaHandle, XnCaptchaProps>(function XnCaptcha(
  {
    value = '',
    onChange,
    captchaId: captchaIdProp = '',
    onCaptchaIdChange,
    mode = 'auto',
    type,
    disabled = false,
    onVerified,
    onPayloadChange,
  },
  ref,
) {
  const [resolvedType, setResolvedType] = useState<CaptchaType>(type || 'IMAGE')
  const [image, setImage] = useState('')
  const [innerId, setInnerId] = useState(captchaIdProp || '')
  const [percent, setPercent] = useState(0)
  const [passed, setPassed] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const percentRef = useRef(0)
  const startXRef = useRef(0)
  const startPercentRef = useRef(0)

  function setProgress(next: number) {
    percentRef.current = next
    setPercent(next)
  }

  function setId(id: string) {
    setInnerId(id)
    onCaptchaIdChange?.(id)
  }

  function buildLocal() {
    const nextType = type || 'IMAGE'
    setResolvedType(nextType)
    setId(`local-${Date.now()}`)
    if (nextType === 'SLIDER') {
      setImage('')
      return
    }
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let answer = ''
    for (let i = 0; i < 4; i += 1) answer += chars[Math.floor(Math.random() * chars.length)]
    setImage(drawLocalCaptcha(answer))
  }

  function drawLocalCaptcha(answer: string) {
    const width = 120
    const height = 40
    const canvas = document.createElement('canvas')
    canvas.width = width * 2
    canvas.height = height * 2
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    ctx.scale(2, 2)
    ctx.fillStyle = '#f4f7fb'
    ctx.fillRect(0, 0, width, height)
    for (let i = 0; i < 5; i += 1) {
      ctx.strokeStyle = `rgba(22, 119, 255, ${0.12 + Math.random() * 0.18})`
      ctx.beginPath()
      ctx.moveTo(Math.random() * width, Math.random() * height)
      ctx.lineTo(Math.random() * width, Math.random() * height)
      ctx.stroke()
    }
    const colors = ['#303133', '#1677ff', '#52c41a', '#faad14']
    for (let i = 0; i < answer.length; i += 1) {
      ctx.save()
      ctx.font = '700 20px "Segoe UI", "PingFang SC", sans-serif'
      ctx.fillStyle = colors[i % colors.length]
      ctx.translate(16 + i * 26, 27)
      ctx.rotate((Math.random() - 0.5) * 0.5)
      ctx.fillText(answer[i], 0, 0)
      ctx.restore()
    }
    return canvas.toDataURL('image/png')
  }

  async function refresh() {
    if (disabled) return
    if (value) onChange?.('')
    setProgress(0)
    setPassed(false)
    onVerified?.(false)
    if (mode === 'local') {
      buildLocal()
      return
    }
    try {
      const res = await fetchCaptcha()
      const data = res.data
      if (!data) return
      setId(data.captchaId)
      setResolvedType(type || data.captchaType || 'IMAGE')
      setImage(data.imageBase64 || '')
      onPayloadChange?.({ captchaId: data.captchaId })
    } catch {
      buildLocal()
    }
  }

  useEffect(() => {
    void refresh()
    // 仅挂载时拉一次，与 Vue onMounted 一致
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useImperativeHandle(ref, () => ({
    refresh,
    getPayload: () => ({ captchaId: innerId, captchaCode: value }),
    captchaId: innerId,
  }))

  function onCode(next: string) {
    onChange?.(next)
    onPayloadChange?.({ captchaId: innerId, captchaCode: next })
  }

  function onStart(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || passed) return
    startXRef.current = event.clientX
    startPercentRef.current = percentRef.current
    const width = trackRef.current?.clientWidth || 240

    const move = (ev: PointerEvent) => {
      const delta = ((ev.clientX - startXRef.current) / width) * 100
      setProgress(Math.min(100, Math.max(0, startPercentRef.current + delta)))
    }
    const up = () => {
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
      void finishSlide(percentRef.current)
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
  }

  async function finishSlide(currentPercent: number) {
    if (currentPercent < 92) {
      setProgress(0)
      return
    }
    setProgress(100)
    if (mode === 'local') {
      setPassed(true)
      onVerified?.(true)
      onPayloadChange?.({ captchaId: innerId, captchaCode: '100' })
      return
    }
    try {
      await verifySliderCaptcha(innerId, 100)
      setPassed(true)
      onVerified?.(true)
      onPayloadChange?.({ captchaId: innerId, captchaCode: '100' })
    } catch {
      setProgress(0)
      setPassed(false)
      onVerified?.(false)
      message.error('滑动验证失败，请重试')
      void refresh()
    }
  }

  if (resolvedType === 'SLIDER') {
    return (
      <div className="xn-captcha">
        <div
          className={`xn-captcha__slider${passed ? ' is-passed' : ''}${disabled ? ' is-disabled' : ''}`}
          ref={trackRef}
          onPointerDown={onStart}
        >
          <div className="xn-captcha__track">
            <div className="xn-captcha__progress" style={{ width: `${percent}%` }} />
            <span className="xn-captcha__text">{passed ? '验证通过' : '拖动滑块完成验证'}</span>
          </div>
          <div
            className="xn-captcha__thumb"
            style={{ left: `calc((100% - 40px) * ${percent} / 100)` }}
          >
            {passed ? '✓' : '»'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="xn-captcha">
      <div className="xn-captcha__image-row">
        <Input
          value={value}
          disabled={disabled}
          maxLength={6}
          placeholder="请输入验证码"
          onChange={(e) => onCode(e.target.value)}
        />
        <button
          type="button"
          className="xn-captcha__image"
          title="点击刷新"
          disabled={disabled}
          onClick={() => void refresh()}
        >
          {image ? <img src={image} alt="验证码" /> : <span>刷新</span>}
          <span className="xn-captcha__image-tip">刷新</span>
        </button>
      </div>
    </div>
  )
})

export default XnCaptcha
