import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import { Form, Input, Modal, Radio, Select, TreeSelect, message } from 'antd'
import { getPasswordRules, type PasswordRules } from '@/api/auth'
import { getOptions as getRoleOptions } from '@/api/role'
import { getTree as getUnitTree } from '@/api/unit'
import { getOptions as getPostOptions } from '@/api/post'
import { create, get, update } from '@/api/user'
import { usePermission } from '@/hooks/usePermission'
import type { Post, Role, SysUnit, UserForm } from '@/types'
import { saveDialogTitle, type SaveMode } from '@/types/save'

export interface UserSaveHandle {
  open: (mode: SaveMode, id?: number) => Promise<void>
}

interface Props {
  onSuccess?: () => void
}

function toTreeData(
  nodes: SysUnit[],
): { title: string; value: number; children?: ReturnType<typeof toTreeData> }[] {
  return nodes.map((n) => ({
    title: n.name,
    value: n.id,
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }))
}

const UserSave = forwardRef<UserSaveHandle, Props>(function UserSave({ onSuccess }, ref) {
  const { isSuperAdmin, hasPermission } = usePermission()
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<SaveMode>('add')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [roleOptions, setRoleOptions] = useState<Role[]>([])
  const [unitOptions, setUnitOptions] = useState<SysUnit[]>([])
  const [postOptions, setPostOptions] = useState<Post[]>([])
  const [passwordRules, setPasswordRules] = useState<PasswordRules | null>(null)
  const [form] = Form.useForm<UserForm>()

  const pwdTip = passwordRules?.tip || '不少于 6 位'
  const sensitiveFieldsLocked =
    mode !== 'add' && editingId != null && !hasPermission('user:sensitive:view')

  const availableRoles = useMemo(
    () => (isSuperAdmin() ? roleOptions : roleOptions.filter((r) => r.code !== 'SUPER_ADMIN')),
    [isSuperAdmin, roleOptions],
  )

  async function ensureOptions() {
    const tasks: Promise<void>[] = []
    if (!roleOptions.length) {
      tasks.push(getRoleOptions().then((res) => setRoleOptions(res.data || [])))
    }
    if (!unitOptions.length) {
      tasks.push(getUnitTree().then((res) => setUnitOptions(res.data || [])))
    }
    if (!postOptions.length) {
      tasks.push(getPostOptions().then((res) => setPostOptions(res.data || [])))
    }
    if (!passwordRules) {
      tasks.push(
        getPasswordRules()
          .then((res) => setPasswordRules(res.data))
          .catch(() => setPasswordRules(null)),
      )
    }
    await Promise.all(tasks)
  }

  useImperativeHandle(ref, () => ({
    async open(openMode, id) {
      setMode(openMode)
      setEditingId(id ?? null)
      form.resetFields()
      form.setFieldsValue({
        username: '',
        password: '',
        nickname: '',
        email: '',
        phone: '',
        status: 1,
        roleIds: [],
        unitId: undefined,
        postId: undefined,
      })
      await ensureOptions()
      setVisible(true)
      if (openMode !== 'add' && id) {
        const res = await get(id)
        form.setFieldsValue({
          username: res.data.username,
          nickname: res.data.nickname,
          email: res.data.email,
          phone: res.data.phone,
          status: res.data.status,
          roleIds: (res.data.roleList || []).map((r) => r.id),
          unitId: res.data.unitId ?? undefined,
          postId: res.data.postId ?? undefined,
          password: '',
        })
      }
    },
  }))

  async function handleSubmit() {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      const payload: UserForm = { ...values }
      if (mode === 'edit' && editingId) {
        if (!payload.password) delete payload.password
        await update(editingId, payload)
        message.success('更新成功')
      } else {
        await create(payload)
        message.success('创建成功')
      }
      setVisible(false)
      onSuccess?.()
    } finally {
      setSubmitting(false)
    }
  }

  const usernameDisabled =
    mode === 'view' || (editingId !== null && form.getFieldValue('username') === 'admin')

  return (
    <Modal
      title={saveDialogTitle(mode, '用户')}
      open={visible}
      onCancel={() => setVisible(false)}
      destroyOnHidden
      width={560}
      okText="保存"
      cancelText={mode === 'view' ? '关闭' : '取消'}
      okButtonProps={{ style: mode === 'view' ? { display: 'none' } : undefined }}
      confirmLoading={submitting}
      onOk={() => void handleSubmit()}
    >
      <Form form={form} labelCol={{ span: 5 }} disabled={mode === 'view'}>
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input disabled={usernameDisabled} />
        </Form.Item>
        <Form.Item
          name="password"
          label="密码"
          rules={[
            {
              validator: async (_, value) => {
                if (mode === 'add' && !value) throw new Error('请输入密码')
                if (!value) return
                const min = passwordRules?.minLength ?? 6
                const max = passwordRules?.maxLength ?? 50
                if (value.length < min || value.length > max) {
                  throw new Error(`密码长度需在${min}-${max}之间`)
                }
                if (passwordRules?.requireUpper && !/[A-Z]/.test(value)) {
                  throw new Error('密码须包含大写字母')
                }
                if (passwordRules?.requireLower && !/[a-z]/.test(value)) {
                  throw new Error('密码须包含小写字母')
                }
                if (passwordRules?.requireDigit && !/\d/.test(value)) {
                  throw new Error('密码须包含数字')
                }
                if (passwordRules?.requireSpecial && !/[^A-Za-z0-9]/.test(value)) {
                  throw new Error('密码须包含特殊字符')
                }
              },
            },
          ]}
          extra={editingId ? `修改时须符合策略：${pwdTip}` : pwdTip}
        >
          <Input.Password placeholder={editingId ? '留空则不修改密码' : '请输入密码'} />
        </Form.Item>
        <Form.Item name="nickname" label="昵称">
          <Input />
        </Form.Item>
        <Form.Item
          name="email"
          label="邮箱"
          extra={sensitiveFieldsLocked ? '无「查看敏感信息」权限，已脱敏且不可修改' : undefined}
        >
          <Input disabled={sensitiveFieldsLocked} />
        </Form.Item>
        <Form.Item name="phone" label="手机号">
          <Input disabled={sensitiveFieldsLocked} />
        </Form.Item>
        <Form.Item name="roleIds" label="角色" extra="可与单位默认角色叠加；二者至少其一有角色即可">
          <Select
            mode="multiple"
            allowClear
            placeholder="个人角色（可选，若单位已绑默认角色）"
            options={availableRoles.map((r) => ({ label: r.name, value: r.id }))}
          />
        </Form.Item>
        <Form.Item name="unitId" label="单位">
          <TreeSelect
            allowClear
            treeDefaultExpandAll
            treeCheckStrictly={false}
            placeholder="请选择单位"
            treeData={toTreeData(unitOptions)}
          />
        </Form.Item>
        <Form.Item name="postId" label="岗位">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="请选择岗位"
            options={postOptions.map((p) => ({ label: p.name, value: p.id }))}
          />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Radio.Group
            options={[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
})

export default UserSave
