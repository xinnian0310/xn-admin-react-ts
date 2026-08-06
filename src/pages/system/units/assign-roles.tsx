import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import { Form, Modal, Select, message } from 'antd'
import { assignRoles, get } from '@/api/unit'
import { getOptions as getRoleOptions } from '@/api/role'
import { usePermission } from '@/hooks/usePermission'
import type { Role, SysUnit } from '@/types'

export interface UnitAssignRolesHandle {
  open: (row: SysUnit) => Promise<void>
}

const UnitAssignRoles = forwardRef<UnitAssignRolesHandle, { onSuccess?: () => void }>(
  function UnitAssignRoles({ onSuccess }, ref) {
    const { isSuperAdmin } = usePermission()
    const [visible, setVisible] = useState(false)
    const [unit, setUnit] = useState<SysUnit | null>(null)
    const [roleOptions, setRoleOptions] = useState<Role[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [form] = Form.useForm<{ roleIds: number[] }>()

    const availableRoles = useMemo(
      () => (isSuperAdmin() ? roleOptions : roleOptions.filter((r) => r.code !== 'SUPER_ADMIN')),
      [isSuperAdmin, roleOptions],
    )

    useImperativeHandle(ref, () => ({
      async open(row) {
        setUnit(row)
        form.resetFields()
        const [rolesRes, detail] = await Promise.all([getRoleOptions(), get(row.id)])
        setRoleOptions(rolesRes.data || [])
        form.setFieldsValue({
          roleIds: detail.data.roleIds || (detail.data.roleList || []).map((r) => r.id),
        })
        setVisible(true)
      },
    }))

    async function handleSubmit() {
      if (!unit) return
      const values = await form.validateFields()
      setSubmitting(true)
      try {
        await assignRoles(unit.id, values.roleIds || [])
        message.success('分配成功')
        setVisible(false)
        onSuccess?.()
      } finally {
        setSubmitting(false)
      }
    }

    return (
      <Modal
        title={`分配角色 - ${unit?.name || ''}`}
        open={visible}
        onCancel={() => setVisible(false)}
        destroyOnHidden
        width={480}
        confirmLoading={submitting}
        onOk={() => void handleSubmit()}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="roleIds"
            label="默认角色"
            extra="单位下用户将自动继承这些角色，可与个人角色叠加"
          >
            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="label"
              options={availableRoles.map((r) => ({ label: r.name, value: r.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    )
  },
)

export default UnitAssignRoles
