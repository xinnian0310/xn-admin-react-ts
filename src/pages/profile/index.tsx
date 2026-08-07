import { useEffect, useMemo, useState } from 'react'
import { Alert, Avatar, Button, Form, Input, Space, Tag, Upload, message } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  changePassword,
  getPasswordRules,
  uploadAvatar,
  type PasswordRules,
} from '@/api/auth'
import { useUserStore } from '@/stores/user'
import './profile.scss'

export default function ProfilePage() {
  const [searchParams] = useSearchParams()
  const forcePwd = searchParams.get('forcePwd') === '1'
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const fetchProfile = useUserStore((s) => s.fetchProfile)
  const updateProfile = useUserStore((s) => s.updateProfile)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [pwdRules, setPwdRules] = useState<PasswordRules | null>(null)
  const [form] = Form.useForm()
  const [pwdForm] = Form.useForm()

  const canEdit = user?.username !== 'SuperAdmin'
  const roleText = useMemo(
    () => (user?.roleList || []).map((r) => r.name).join('、') || user?.role || '—',
    [user],
  )
  const avatarText = (user?.nickname || user?.username || '?').charAt(0).toUpperCase()

  function syncForm(data = user) {
    form.setFieldsValue({
      username: data?.username || '',
      nickname: data?.nickname || '',
      email: data?.email || '',
      phone: data?.phone || '',
    })
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
    if (forcePwd && canEdit) setEditing(true)
  }, [forcePwd, canEdit])

  function startEdit() {
    if (!canEdit) {
      message.warning('超级管理员禁止编辑个人信息')
      return
    }
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
    if (!canEdit) return
    const values = await form.validateFields()
    const pwdValues = pwdForm.getFieldsValue()
    const hasPwdInput = Boolean(
      pwdValues.oldPassword || pwdValues.newPassword || pwdValues.confirmPassword,
    )
    if (forcePwd || hasPwdInput) await pwdForm.validateFields()

    setSaving(true)
    try {
      await updateProfile({
        nickname: values.nickname,
        email: values.email,
        phone: values.phone,
      })
      if (forcePwd || hasPwdInput) {
        await changePassword({
          oldPassword: pwdValues.oldPassword,
          newPassword: pwdValues.newPassword,
        })
        pwdForm.resetFields()
        await fetchProfile()
        message.success(forcePwd ? '密码已修改' : '资料与密码已保存')
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

  async function handleAvatarUpload(file: File) {
    setAvatarUploading(true)
    try {
      await uploadAvatar(file)
      await fetchProfile()
      message.success('头像已更新')
    } finally {
      setAvatarUploading(false)
    }
  }

  const formDisabled = !canEdit || !editing

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
          message="按安全策略要求，请先修改密码后再继续使用系统"
        />
      ) : null}
      {!canEdit ? (
        <Alert
          type="warning"
          showIcon
          className="profile-page__alert"
          message="超级管理员账号禁止编辑个人信息"
        />
      ) : null}

      <div className="profile-page__body">
        <aside className="profile-page__avatar">
          <Avatar size={88} src={user?.avatar}>
            {avatarText}
          </Avatar>
          <div className="profile-page__name">{user?.nickname || user?.username}</div>
          <div className="profile-page__role">{roleText}</div>
          {canEdit ? (
            <Upload
              showUploadList={false}
              accept="image/jpeg,image/png,image/gif,image/webp"
              beforeUpload={(file) => {
                void handleAvatarUpload(file)
                return false
              }}
            >
              <Button size="small" loading={avatarUploading}>
                更换头像
              </Button>
            </Upload>
          ) : null}
        </aside>

        <div className="profile-page__main">
          <div className="profile-page__panels">
            <div className="profile-page__panel">
              <div className="profile-page__section-title">基本信息</div>
              <Form form={form} labelCol={{ flex: '88px' }} disabled={formDisabled}>
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
                <Form.Item label="手机" name="phone">
                  <Input maxLength={20} placeholder="请输入手机号" />
                </Form.Item>
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
              <Form form={pwdForm} labelCol={{ flex: '88px' }} disabled={formDisabled}>
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
                  修改
                </Button>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
