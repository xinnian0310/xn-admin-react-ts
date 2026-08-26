import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Button, Input, Modal, Typography, message } from 'antd'
import './xnSmsCode.scss'

const PHONE_RE = /^1[3-9]\d{9}$/

export type XnSmsCodeHandle = {
  send: () => Promise<void>
}

export type XnSmsCodeProps = {
  value?: string
  onChange?: (value: string) => void
  /** 发送目标手机号；不合法时不能发送 */
  phone?: string
  countdown?: number
  /** 传入则真正发短信；local 模式忽略 */
  request?: (phone: string) => Promise<void | { code?: string | null }>
  /** auto：走 request；local：演示倒计时，不打接口 */
  mode?: 'auto' | 'local'
  disabled?: boolean
  maxLength?: number
  placeholder?: string
  sendText?: string
  onSent?: (phone: string) => void
  onError?: (message: string) => void
}

const XnSmsCode = forwardRef<XnSmsCodeHandle, XnSmsCodeProps>(function XnSmsCode(
  {
    value = '',
    onChange,
    phone = '',
    countdown = 60,
    request,
    mode = 'auto',
    disabled = false,
    maxLength = 6,
    placeholder = '请输入短信验证码',
    sendText = '获取验证码',
    onSent,
    onError,
  },
  ref,
) {
  const [remain, setRemain] = useState(0)
  const [sending, setSending] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => () => clearTimer(), [])

  const sendDisabled = useMemo(
    () => disabled || sending || remain > 0 || !PHONE_RE.test(phone.trim()),
    [disabled, sending, remain, phone],
  )

  const buttonLabel = remain > 0 ? `${remain}s` : sendText

  function handleCode(next: string) {
    onChange?.(next.replace(/\D/g, '').slice(0, maxLength))
  }

  function startCountdown() {
    setRemain(countdown)
    clearTimer()
    timerRef.current = setInterval(() => {
      setRemain((prev) => {
        if (prev <= 1) {
          clearTimer()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handleSend() {
    const nextPhone = phone.trim()
    if (disabled || sending || remain > 0) return
    if (!PHONE_RE.test(nextPhone)) {
      message.warning('请输入正确的手机号')
      return
    }
    setSending(true)
    try {
      if (mode !== 'local') {
        if (!request) throw new Error('未配置短信发送请求')
        const result = await request(nextPhone)
        const code = result && typeof result === 'object' ? result.code : undefined
        if (code) {
          await new Promise<void>((resolve) => {
            Modal.success({
              title: `短信  ${nextPhone}`,
              content: (
                <div>
                  <p style={{ margin: '0 0 8px' }}>【心念科技】您的验证码为</p>
                  <Typography.Text
                    copyable={{ text: code, tooltips: ['复制验证码', '已复制'] }}
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      letterSpacing: 6,
                      userSelect: 'all',
                    }}
                  >
                    {code}
                  </Typography.Text>
                  <p style={{ margin: '8px 0 0', color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
                    5分钟内有效，可全选或点复制
                  </p>
                </div>
              ),
              okText: '知道了',
              onOk: () => resolve(),
              afterClose: () => resolve(),
            })
          })
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 280))
        message.success('验证码已发送（演示）')
      }
      startCountdown()
      onSent?.(nextPhone)
    } catch (error) {
      const text = error instanceof Error ? error.message : '发送失败'
      onError?.(text)
      message.error(text)
    } finally {
      setSending(false)
    }
  }

  useImperativeHandle(ref, () => ({ send: handleSend }))

  return (
    <div className="xn-sms-code">
      <Input
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => handleCode(e.target.value)}
      />
      <Button disabled={sendDisabled} loading={sending} onClick={() => void handleSend()}>
        {buttonLabel}
      </Button>
    </div>
  )
})

export default XnSmsCode
