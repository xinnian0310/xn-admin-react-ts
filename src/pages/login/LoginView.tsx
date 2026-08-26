import { useEffect, useRef, useState } from 'react'
import { Button, Form, Input, Tabs, message } from 'antd'
import { LockOutlined, MobileOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { appConfig, defaultAppConfig } from '@/config/app'
import { homeConfig } from '@/config/home'
import { useUserStore } from '@/stores/user'
import { getActive } from '@/api/login-page'
import { register as registerApi, sendSms } from '@/api/auth'
import type { LoginCaptchaType } from '@/types'
import XnAppIcon from '@/components/XnAppIcon'
import XnCaptcha, { type XnCaptchaHandle } from '@/components/XnCaptcha'
import XnSmsCode from '@/components/XnSmsCode'
import './LoginView.scss'

type AuthMode = 'login' | 'register'
type LoginTab = 'account' | 'sms'

const DEMO_PHONE = '18888888888'

export default function LoginView() {
  const navigate = useNavigate()
  const login = useUserStore((s) => s.login)
  const loginBySms = useUserStore((s) => s.loginBySms)
  const [form] = Form.useForm()
  const [mode, setMode] = useState<AuthMode>('login')
  const [loginTab, setLoginTab] = useState<LoginTab>('account')
  const [loading, setLoading] = useState(false)
  const intro = homeConfig.intro
  const isRegister = mode === 'register'
  const isSmsLogin = !isRegister && loginTab === 'sms'
  const phone = Form.useWatch('phone', form) || ''
  const localLogo = defaultAppConfig.app.logo
  const configuredLogo = (appConfig.app.logo || '').trim() || localLogo
  const [brokenLogo, setBrokenLogo] = useState<string | null>(null)
  const logoSrc = brokenLogo === configuredLogo ? localLogo : configuredLogo

  const [captchaEnabled, setCaptchaEnabled] = useState(false)
  const [captchaType, setCaptchaType] = useState<LoginCaptchaType | null>(null)
  const [captchaId, setCaptchaId] = useState('')
  const [sliderOk, setSliderOk] = useState(false)
  const captchaRef = useRef<XnCaptchaHandle>(null)

  function refreshCaptcha() {
    if (!captchaEnabled) return
    form.setFieldValue('captcha', '')
    setSliderOk(false)
    void captchaRef.current?.refresh()
  }

  function switchMode(next: AuthMode) {
    setMode(next)
    setLoginTab('account')
    form.resetFields()
    form.setFieldsValue(
      next === 'login'
        ? { username: 'admin', password: 'admin', phone: DEMO_PHONE, smsCode: '' }
        : {
            username: '',
            password: '',
            nickname: '',
            confirmPassword: '',
            captcha: '',
            phone: '',
            smsCode: '',
          },
    )
    void refreshCaptcha()
  }

  async function sendLoginSms(nextPhone: string) {
    const res = await sendSms({ phone: nextPhone, scene: 'LOGIN' })
    return res.data
  }

  useEffect(() => {
    void (async () => {
      try {
        const res = await getActive()
        setCaptchaEnabled(Boolean(res.data?.captchaEnabled))
        setCaptchaType(res.data?.captchaType || null)
      } catch {
        /* 后端未启动时允许无验证码尝试 */
      }
    })()
  }, [])

  async function handleSubmit() {
    try {
      const values = isSmsLogin
        ? await form.validateFields(['phone', 'smsCode'])
        : await form.validateFields()
      if (!isSmsLogin && captchaEnabled && captchaType === 'SLIDER' && !sliderOk) {
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
      if (isSmsLogin) {
        const data = await loginBySms(values.phone, values.smsCode)
        if (data.user?.mustChangePassword) {
          message.warning('请先修改密码后再使用系统')
          navigate('/profile?forcePwd=1', { replace: true })
        } else {
          message.success('登录成功')
          navigate('/dashboard', { replace: true })
        }
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
              <img
                src={logoSrc}
                alt="心念科技"
                onError={() => {
                  setBrokenLogo(configuredLogo)
                }}
              />
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
                {isRegister ? '注册后将以普通用户身份使用系统' : '登录以继续管理您的系统'}
              </p>
            </header>
            {!isRegister ? (
              <Tabs
                className="login-tabs"
                activeKey={loginTab}
                onChange={(key) => setLoginTab(key as LoginTab)}
                items={[
                  { key: 'account', label: '账号登录' },
                  { key: 'sms', label: '短信登录' },
                ]}
              />
            ) : null}
            <Form
              form={form}
              size="large"
              initialValues={{
                username: 'admin',
                password: 'admin',
                phone: DEMO_PHONE,
                smsCode: '',
                captcha: '',
              }}
              onFinish={() => void handleSubmit()}
            >
              {isSmsLogin ? (
                <>
                  <Form.Item
                    name="phone"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                    ]}
                  >
                    <Input
                      prefix={<MobileOutlined />}
                      placeholder="请输入手机号"
                      maxLength={11}
                      allowClear
                    />
                  </Form.Item>
                  <Form.Item
                    name="smsCode"
                    rules={[
                      { required: true, message: '请输入短信验证码' },
                      { pattern: /^\d{6}$/, message: '验证码为6位数字' },
                    ]}
                  >
                    <XnSmsCode phone={phone} request={sendLoginSms} />
                  </Form.Item>
                  <p className="sms-hint">演示号 18888888888（admin），验证码将弹窗展示</p>
                </>
              ) : (
                <>
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
                    <Form.Item
                      name="captcha"
                      validateTrigger="onBlur"
                      rules={[{ required: true, message: '请输入验证码' }]}
                    >
                      <XnCaptcha
                        ref={captchaRef}
                        mode="auto"
                        type="IMAGE"
                        captchaId={captchaId}
                        onCaptchaIdChange={setCaptchaId}
                      />
                    </Form.Item>
                  ) : null}
                  {captchaEnabled && captchaType === 'SLIDER' ? (
                    <Form.Item>
                      <XnCaptcha
                        ref={captchaRef}
                        mode="auto"
                        type="SLIDER"
                        captchaId={captchaId}
                        onCaptchaIdChange={setCaptchaId}
                        onVerified={setSliderOk}
                      />
                    </Form.Item>
                  ) : null}
                </>
              )}
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
                  <button
                    type="button"
                    className="login-switch-link"
                    onClick={() => switchMode('login')}
                  >
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
