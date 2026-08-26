import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Form, Input, Space, Tag, message } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  bindPhone,
  changePassword,
  getPasswordRules,
  sendSms,
  uploadAvatar,
  type PasswordRules,
} from '@/api/auth'
import XnAvatarCrop from '@/components/XnAvatarCrop'
import XnSmsCode from '@/components/XnSmsCode'
import { usePermissionStore } from '@/stores/permission'
import { useUserStore } from '@/stores/user'
import './profile.scss'

export default function ProfilePage() {
  const [searchParams] = useSearchParams()
  const forcePwd = searchParams.get('forcePwd') === '1'
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const fetchProfile = useUserStore((s) => s.fetchProfile)
  const updateProfile = useUserStore((s) => s.updateProfile)
  const roles = usePermissionStore((s) => s.roles)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [pwdRules, setPwdRules] = useState<PasswordRules | null>(null)
  const [form] = Form.useForm()
  const [pwdForm] = Form.useForm()

  const canEditProfile = !roles.includes('SUPER_ADMIN') && !roles.includes('ADMIN')
  const canEditPassword = !roles.includes('ADMIN')
  const canEdit = canEditProfile || canEditPassword
  const roleText = useMemo(
    () => (user?.roleList || []).map((r) => r.name).join('、') || user?.role || '—',
    [user],
  )
  const avatarText = (user?.nickname || user?.username || '?').charAt(0).toUpperCase()
  const phone = (Form.useWatch('phone', form) || '').trim()
  const phoneNeedsBind = Boolean(phone) && phone !== (user?.phone || '').trim()

  function syncForm(data = user) {
    form.setFieldsValue({
      username: data?.username || '',
      nickname: data?.nickname || '',
      email: data?.email || '',
      phone: data?.phone || '',
      smsCode: '',
    })
  }

  async function sendBindSms(nextPhone: string) {
    const res = await sendSms({ phone: nextPhone, scene: 'BIND' })
    return res.data
  }

  async function loadProfile() {
    setLoading(true)
    try {
      const data = await fetchProfile()
      syncForm(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProfile()
    void getPasswordRules()
      .then((res) => setPwdRules(res.data))
      .catch(() => setPwdRules(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (forcePwd && canEditPassword) setEditing(true)
  }, [forcePwd, canEditPassword])

  function startEdit() {
    syncForm()
    pwdForm.resetFields()
    setEditing(true)
  }

  function cancelEdit() {
    syncForm()
    pwdForm.resetFields()
    setEditing(false)
  }

  async function handleSave() {
    const pwdValues = pwdForm.getFieldsValue()
    const hasPwdInput = Boolean(
      pwdValues.oldPassword || pwdValues.newPassword || pwdValues.confirmPassword,
    )

    if (canEditProfile) {
      await form.validateFields()
    }
    if (forcePwd || hasPwdInput || !canEditProfile) {
      await pwdForm.validateFields()
    }

    setSaving(true)
    try {
      if (canEditProfile) {
        const values = form.getFieldsValue()
        const nextPhone = String(values.phone || '').trim()
        const needsBind = Boolean(nextPhone) && nextPhone !== (user?.phone || '').trim()
        if (needsBind) {
          await bindPhone({ phone: nextPhone, code: values.smsCode })
        }
        await updateProfile({
          nickname: values.nickname,
          email: values.email,
          ...(needsBind ? {} : { phone: nextPhone }),
        })
      }
      if (forcePwd || hasPwdInput || !canEditProfile) {
        const pwd = await pwdForm.validateFields()
        await changePassword({
          oldPassword: pwd.oldPassword,
          newPassword: pwd.newPassword,
        })
        pwdForm.resetFields()
        await fetchProfile()
        message.success(
          forcePwd ? '密码已修改' : canEditProfile ? '资料与密码已保存' : '密码已修改',
        )
        if (forcePwd) {
          setEditing(false)
          navigate('/dashboard', { replace: true })
          return
        }
      } else {
        message.success('保存成功')
      }
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function uploadAvatarFile(file: File) {
    const res = await uploadAvatar(file)
    await fetchProfile()
    return res.data?.avatar || ''
  }

  const profileFormDisabled = !canEditProfile || !editing
  const passwordFormDisabled = !canEditPassword || !editing

  return (
    <div className="page-card profile-page" style={{ opacity: loading ? 0.7 : 1 }}>
      <div className="page-header">
        <h2 className="page-title">个人信息</h2>
        <Button onClick={() => void loadProfile()}>刷新</Button>
      </div>

      {forcePwd ? (
        <Alert
          type="warning"
          showIcon
          className="profile-page__alert"
          title="按安全策略要求，请先修改密码后再继续使用系统"
        />
      ) : null}
      {!canEditProfile ? (
        <Alert
          type="warning"
          showIcon
          className="profile-page__alert"
          title={
            canEditPassword
              ? '超级管理员仅可修改密码，不可改用户名与基本资料'
              : '管理员不可修改个人信息与密码'
          }
        />
      ) : null}

      <div className="profile-page__body">
        <aside className="profile-page__avatar">
          <XnAvatarCrop
            value={user?.avatar || ''}
            fallback={avatarText}
            disabled={!canEditProfile}
            request={uploadAvatarFile}
          />
          <div className="profile-page__name">{user?.nickname || user?.username}</div>
          <div className="profile-page__role">{roleText}</div>
        </aside>

        <div className="profile-page__main">
          <div className="profile-page__panels">
            <div className="profile-page__panel">
              <div className="profile-page__section-title">基本信息</div>
              <Form form={form} labelCol={{ flex: '88px' }} disabled={profileFormDisabled}>
                <Form.Item label="用户名" name="username">
                  <Input disabled />
                </Form.Item>
                <Form.Item
                  label="昵称"
                  name="nickname"
                  rules={[{ required: true, message: '请输入昵称' }]}
                >
                  <Input maxLength={50} placeholder="请输入昵称" />
                </Form.Item>
                <Form.Item label="邮箱" name="email">
                  <Input maxLength={100} placeholder="请输入邮箱" />
                </Form.Item>
                <Form.Item
                  label="手机"
                  name="phone"
                  rules={[{ pattern: /^$|^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}
                >
                  <Input maxLength={11} placeholder="请输入手机号" />
                </Form.Item>
                {editing && canEditProfile && phoneNeedsBind ? (
                  <Form.Item
                    name="smsCode"
                    rules={[
                      {
                        validator: (_, value) => {
                          if (!phoneNeedsBind) return Promise.resolve()
                          if (!value) return Promise.reject(new Error('请输入短信验证码'))
                          if (!/^\d{6}$/.test(String(value))) {
                            return Promise.reject(new Error('验证码为6位数字'))
                          }
                          return Promise.resolve()
                        },
                      },
                    ]}
                  >
                    <XnSmsCode phone={phone} request={sendBindSms} />
                  </Form.Item>
                ) : null}
                <div className="profile-page__meta-grid">
                  <Form.Item label="单位">
                    <span>{user?.unitName || '—'}</span>
                  </Form.Item>
                  <Form.Item label="岗位">
                    <span>{user?.postName || '—'}</span>
                  </Form.Item>
                  <Form.Item label="状态">
                    <Tag color={user?.status === 1 ? 'success' : 'default'}>
                      {user?.status === 1 ? '启用' : '停用'}
                    </Tag>
                  </Form.Item>
                  <Form.Item label="角色">
                    <span>{roleText}</span>
                  </Form.Item>
                </div>
              </Form>
            </div>

            <div className="profile-page__panel">
              <div className="profile-page__section-title">修改密码</div>
              <Form form={pwdForm} labelCol={{ flex: '88px' }} disabled={passwordFormDisabled}>
                <Form.Item
                  label="原密码"
                  name="oldPassword"
                  rules={[{ required: true, message: '请输入原密码' }]}
                >
                  <Input.Password autoComplete="current-password" placeholder="请输入原密码" />
                </Form.Item>
                <Form.Item
                  label="新密码"
                  name="newPassword"
                  rules={[{ required: true, message: '请输入新密码' }]}
                  extra={pwdRules?.tip}
                >
                  <Input.Password
                    autoComplete="new-password"
                    placeholder={pwdRules?.tip || '请输入新密码'}
                  />
                </Form.Item>
                <Form.Item
                  label="确认密码"
                  name="confirmPassword"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: '请再次输入新密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value)
                          return Promise.resolve()
                        return Promise.reject(new Error('两次输入的密码不一致'))
                      },
                    }),
                  ]}
                >
                  <Input.Password autoComplete="new-password" placeholder="再次输入新密码" />
                </Form.Item>
              </Form>
            </div>
          </div>

          <div className="profile-page__footer">
            {canEdit ? (
              editing ? (
                <Space>
                  <Button onClick={cancelEdit} disabled={saving}>
                    取消
                  </Button>
                  <Button type="primary" loading={saving} onClick={() => void handleSave()}>
                    保存
                  </Button>
                </Space>
              ) : (
                <Button type="primary" onClick={startEdit}>
                  {canEditProfile ? '修改' : '修改密码'}
                </Button>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
