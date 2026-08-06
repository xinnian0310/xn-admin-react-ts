import { useEffect, useMemo, useState } from 'react'
import { Alert, Avatar, Button, Form, Input, Space, Tag, message } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { changePassword, getPasswordRules, type PasswordRules } from '@/api/auth'
import { useUserStore } from '@/stores/user'

export default function ProfilePage() {
  const [searchParams] = useSearchParams()
  const forcePwd = searchParams.get('forcePwd') === '1'
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const fetchProfile = useUserStore((s) => s.fetchProfile)
  const updateProfile = useUserStore((s) => s.updateProfile)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdRules, setPwdRules] = useState<PasswordRules | null>(null)
  const [form] = Form.useForm()
  const [pwdForm] = Form.useForm()

  const canEdit = user?.username !== 'SuperAdmin'
  const roleText = useMemo(
    () => (user?.roleList || []).map((r) => r.name).join('、') || user?.role || '—',
    [user],
  )
  const avatarText = (user?.nickname || user?.username || '?').charAt(0).toUpperCase()

  async function loadProfile() {
    setLoading(true)
    try {
      const data = await fetchProfile()
      form.setFieldsValue({
        username: data.username,
        nickname: data.nickname,
        email: data.email,
        phone: data.phone,
      })
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

  async function handleSave() {
    if (!canEdit) return
    const values = await form.validateFields()
    setSaving(true)
    try {
      await updateProfile({
        nickname: values.nickname,
        email: values.email,
        phone: values.phone,
      })
      message.success('保存成功')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (!canEdit) return
    const values = await pwdForm.validateFields()
    setPwdSaving(true)
    try {
      await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })
      message.success('密码修改成功')
      pwdForm.resetFields()
      await fetchProfile()
      if (forcePwd) navigate('/dashboard', { replace: true })
    } finally {
      setPwdSaving(false)
    }
  }

  return (
    <div className="page-card" style={{ opacity: loading ? 0.7 : 1 }}>
      <div className="page-header">
        <h2 className="page-title">个人信息</h2>
        <Space>
          <Button onClick={() => void loadProfile()}>刷新</Button>
          <Button
            type="primary"
            disabled={!canEdit || saving}
            loading={saving}
            onClick={() => void handleSave()}
          >
            保存资料
          </Button>
        </Space>
      </div>

      {forcePwd ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="按安全策略要求，请先修改密码后再继续使用系统"
        />
      ) : null}
      {!canEdit ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="超级管理员账号禁止编辑个人信息"
        />
      ) : null}

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ width: 160, textAlign: 'center' }}>
          <Avatar size={88} src={user?.avatar}>
            {avatarText}
          </Avatar>
          <div style={{ marginTop: 12, fontWeight: 600 }}>{user?.nickname || user?.username}</div>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>{roleText}</div>
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          <Form form={form} labelCol={{ span: 4 }} disabled={!canEdit} style={{ maxWidth: 560 }}>
            <Form.Item label="用户名" name="username">
              <Input disabled />
            </Form.Item>
            <Form.Item
              label="昵称"
              name="nickname"
              rules={[{ required: true, message: '请输入昵称' }]}
            >
              <Input maxLength={50} />
            </Form.Item>
            <Form.Item label="邮箱" name="email">
              <Input maxLength={100} />
            </Form.Item>
            <Form.Item label="手机" name="phone">
              <Input maxLength={20} />
            </Form.Item>
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
          </Form>

          <Form
            form={pwdForm}
            labelCol={{ span: 4 }}
            disabled={!canEdit}
            style={{ maxWidth: 560, marginTop: 24 }}
          >
            <div style={{ fontWeight: 600, marginBottom: 12 }}>修改密码</div>
            <Form.Item
              label="原密码"
              name="oldPassword"
              rules={[{ required: true, message: '请输入原密码' }]}
            >
              <Input.Password autoComplete="current-password" />
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
                    if (!value || getFieldValue('newPassword') === value) return Promise.resolve()
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item label=" ">
              <Button
                type="primary"
                danger
                disabled={!canEdit || pwdSaving}
                loading={pwdSaving}
                onClick={() => void handleChangePassword()}
              >
                确认修改密码
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  )
}
