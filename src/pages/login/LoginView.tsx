import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Button, Form, Input, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { appConfig } from '@/config/app'
import { homeConfig } from '@/config/home'
import { useUserStore } from '@/stores/user'
import { getActive } from '@/api/login-page'
import { fetchCaptcha, register as registerApi, verifySliderCaptcha } from '@/api/auth'
import type { LoginCaptchaType } from '@/types'
import XnAppIcon from '@/components/XnAppIcon'
import './LoginView.scss'

type AuthMode = 'login' | 'register'

export default function LoginView() {
  const navigate = useNavigate()
  const login = useUserStore((s) => s.login)
  const [form] = Form.useForm()
  const [mode, setMode] = useState<AuthMode>('login')
  const [loading, setLoading] = useState(false)
  const intro = homeConfig.intro
  const isRegister = mode === 'register'

  const [captchaEnabled, setCaptchaEnabled] = useState(false)
  const [captchaType, setCaptchaType] = useState<LoginCaptchaType | null>(null)
  const [captchaId, setCaptchaId] = useState('')
  const [captchaImage, setCaptchaImage] = useState('')
  const [sliderPercent, setSliderPercent] = useState(0)
  const [sliderOk, setSliderOk] = useState(false)
  const sliderPercentRef = useRef(0)
  const captchaIdRef = useRef('')
  const slideStartX = useRef(0)
  const slideStartPercent = useRef(0)

  useEffect(() => {
    sliderPercentRef.current = sliderPercent
  }, [sliderPercent])
  useEffect(() => {
    captchaIdRef.current = captchaId
  }, [captchaId])

  async function refreshCaptcha() {
    if (!captchaEnabled) return
    form.setFieldValue('captcha', '')
    resetSlider()
    try {
      const res = await fetchCaptcha()
      const data = res.data
      if (!data) {
        setCaptchaId('')
        setCaptchaImage('')
        return
      }
      setCaptchaId(data.captchaId)
      setCaptchaType(data.captchaType)
      setCaptchaImage(data.imageBase64 || '')
    } catch {
      message.error('获取验证码失败')
    }
  }

  function resetSlider() {
    setSliderPercent(0)
    sliderPercentRef.current = 0
    setSliderOk(false)
  }

  function switchMode(next: AuthMode) {
    setMode(next)
    form.resetFields()
    form.setFieldsValue(
      next === 'login'
        ? { username: 'admin', password: 'admin' }
        : { username: '', password: '', nickname: '', confirmPassword: '', captcha: '' },
    )
    void refreshCaptcha()
  }

  useEffect(() => {
    void (async () => {
      try {
        const res = await getActive()
        const enabled = Boolean(res.data?.captchaEnabled)
        setCaptchaEnabled(enabled)
        setCaptchaType(res.data?.captchaType || null)
        if (enabled) {
          const cap = await fetchCaptcha()
          if (cap.data) {
            setCaptchaId(cap.data.captchaId)
            setCaptchaType(cap.data.captchaType)
            setCaptchaImage(cap.data.imageBase64 || '')
          }
        }
      } catch {
        /* 后端未启动时允许无验证码尝试 */
      }
    })()
  }, [])

  function onSliderStart(e: ReactPointerEvent) {
    if (sliderOk) return
    slideStartX.current = e.clientX
    slideStartPercent.current = sliderPercentRef.current
    const onMove = (ev: PointerEvent) => {
      const track = document.querySelector('.slider-wrap') as HTMLElement | null
      const width = track?.clientWidth || 280
      const delta = ((ev.clientX - slideStartX.current) / width) * 100
      const next = Math.min(100, Math.max(0, slideStartPercent.current + delta))
      sliderPercentRef.current = next
      setSliderPercent(next)
    }
    const onUp = async () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      if (sliderPercentRef.current >= 92 && captchaIdRef.current) {
        setSliderPercent(100)
        try {
          await verifySliderCaptcha(captchaIdRef.current, 100)
          setSliderOk(true)
        } catch {
          message.error('滑块验证失败')
          resetSlider()
          void refreshCaptcha()
        }
      } else {
        resetSlider()
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  async function handleSubmit() {
    try {
      const values = await form.validateFields()
      if (captchaEnabled && captchaType === 'SLIDER' && !sliderOk) {
        message.warning('请完成滑块验证')
        return
      }
      setLoading(true)
      const captchaOpts = {
        captchaId: captchaEnabled ? captchaId : undefined,
        captchaCode: captchaEnabled && captchaType === 'IMAGE' ? values.captcha : undefined,
      }
      if (isRegister) {
        await registerApi({
          username: values.username,
          password: values.password,
          nickname: values.nickname || undefined,
          ...captchaOpts,
        })
        message.success('注册成功，请登录')
        switchMode('login')
        form.setFieldsValue({ username: values.username, password: '' })
        return
      }
      const data = await login(values.username, values.password, captchaOpts)
      if (data.user?.mustChangePassword) {
        message.warning('按安全策略要求，请先修改密码')
        navigate('/profile?forcePwd=1', { replace: true })
      } else {
        message.success('登录成功')
        navigate('/dashboard', { replace: true })
      }
    } catch {
      void refreshCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-atmosphere" aria-hidden>
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
      </div>
      <div className="login-shell">
        <aside className="login-brand">
          <div className="brand-inner">
            <div className="brand-logo-plate">
              <img src={appConfig.app.logo || '/xinnian-tech-logo.png'} alt="心念科技" />
            </div>
            <p className="brand-slogan">心有所念，码有所成</p>
            <p className="brand-desc">
              专注于 IT 开发与软件创新，将每一个想法转化为可靠的软件产品。
            </p>
            <ul className="brand-features">
              {intro.features.map((f) => (
                <li key={f.title}>
                  <XnAppIcon name={f.icon} size={18} />
                  <span>
                    <strong>{f.title}</strong>
                    <em>{f.desc}</em>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="brand-foot">
            <span>{intro.title}</span>
            <span>·</span>
            <span>{intro.version}</span>
          </div>
        </aside>
        <section className="login-panel">
          <div className="login-card">
            <header className="login-header">
              <p className="welcome">{isRegister ? '创建账号' : '欢迎回来'}</p>
              <h1>{appConfig.app.name}</h1>
              <p className="hint">
                {isRegister ? '注册后将以游客身份使用系统' : '登录以继续管理您的系统'}
              </p>
            </header>
            <Form
              form={form}
              size="large"
              initialValues={{ username: 'admin', password: 'admin' }}
              onFinish={() => void handleSubmit()}
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  ...(isRegister
                    ? [{ min: 2, max: 50, message: '用户名长度需在2-50之间' }]
                    : []),
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="请输入用户名" allowClear />
              </Form.Item>
              {isRegister ? (
                <Form.Item name="nickname" rules={[{ max: 50, message: '昵称长度不能超过50' }]}>
                  <Input prefix={<UserOutlined />} placeholder="昵称（可选）" allowClear />
                </Form.Item>
              ) : null}
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
              </Form.Item>
              {isRegister ? (
                <Form.Item
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请再次输入密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve()
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'))
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="请确认密码" />
                </Form.Item>
              ) : null}
              {captchaEnabled && captchaType === 'IMAGE' ? (
                <div className="captcha-row" style={{ marginBottom: 24 }}>
                  <Form.Item
                    name="captcha"
                    rules={[{ required: true, message: '请输入验证码' }]}
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <Input placeholder="请输入验证码" maxLength={6} />
                  </Form.Item>
                  {captchaImage ? (
                    <img
                      src={captchaImage}
                      className="captcha-canvas"
                      alt="验证码"
                      title="点击刷新"
                      onClick={() => void refreshCaptcha()}
                    />
                  ) : (
                    <div
                      className="captcha-canvas captcha-placeholder"
                      onClick={() => void refreshCaptcha()}
                    >
                      刷新
                    </div>
                  )}
                </div>
              ) : null}
              {captchaEnabled && captchaType === 'SLIDER' ? (
                <Form.Item>
                  <div className="slider-wrap">
                    <div className="slider-track">
                      <div className="slider-progress" style={{ width: `${sliderPercent}%` }} />
                      <span className="slider-text">
                        {sliderOk ? '验证通过' : '拖动滑块完成验证'}
                      </span>
                    </div>
                    <div
                      className="slider-thumb"
                      style={{ left: `calc(${sliderPercent}% - 18px)` }}
                      onPointerDown={onSliderStart}
                    >
                      {sliderOk ? '✓' : '»'}
                    </div>
                  </div>
                </Form.Item>
              ) : null}
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className="login-btn"
                >
                  {isRegister ? '注 册' : '登 录'}
                </Button>
              </Form.Item>
            </Form>
            <div className="login-switch">
              {isRegister ? (
                <>
                  已有账号？
                  <button type="button" className="login-switch-link" onClick={() => switchMode('login')}>
                    去登录
                  </button>
                </>
              ) : (
                <>
                  没有账号？
                  <button
                    type="button"
                    className="login-switch-link"
                    onClick={() => switchMode('register')}
                  >
                    去注册
                  </button>
                </>
              )}
            </div>
            <footer className="login-foot">
              {appConfig.app.footer || `${intro.title} · Copyright © 2026`}
            </footer>
          </div>
        </section>
      </div>
    </div>
  )
}
