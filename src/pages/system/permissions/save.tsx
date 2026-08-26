import XnDialog from '@/components/XnDialog'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { Form, Input, InputNumber, TreeSelect, message } from 'antd'
import { create, list, update } from '@/api/permission'
import type { Permission, PermissionForm } from '@/types'
import { saveDialogTitle, type SaveMode } from '@/types/save'

export interface PermissionSaveHandle {
  open: (mode: SaveMode, id?: number) => Promise<void>
}

function menuOnly(nodes: Permission[]): Permission[] {
  return nodes
    .filter((n) => n.type === 'MENU')
    .map((n) => ({
      ...n,
      children: n.children?.length ? menuOnly(n.children) : undefined,
    }))
}

type TreeOption = { title: string; value: number; children?: TreeOption[] }

function toTree(nodes: Permission[]): TreeOption[] {
  return nodes.map((n) => ({
    title: n.name,
    value: n.id,
    children: n.children?.length ? toTree(n.children) : undefined,
  }))
}

function findById(nodes: Permission[], id: number): Permission | undefined {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children?.length) {
      const found = findById(n.children, id)
      if (found) return found
    }
  }
  return undefined
}

const PermissionSave = forwardRef<PermissionSaveHandle, { onSuccess?: () => void }>(
  function PermissionSave({ onSuccess }, ref) {
    const [visible, setVisible] = useState(false)
    const [mode, setMode] = useState<SaveMode>('add')
    const [editingId, setEditingId] = useState<number | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [tree, setTree] = useState<Permission[]>([])
    const [form] = Form.useForm<PermissionForm>()

    useImperativeHandle(ref, () => ({
      async open(openMode, id) {
        setMode(openMode)
        setEditingId(id ?? null)
        form.resetFields()
        form.setFieldsValue({
          code: '',
          name: '',
          type: 'MENU',
          parentId: null,
          path: '',
          sort: 0,
        })
        const res = await list()
        setTree(menuOnly(res.data || []))
        setVisible(true)
        if (openMode !== 'add' && id) {
          const found = findById(res.data || [], id)
          if (found) {
            form.setFieldsValue({
              code: found.code,
              name: found.name,
              type: 'MENU',
              parentId: found.parentId ?? null,
              path: found.path || '',
              sort: found.sort,
            })
          }
        }
      },
    }))

    async function handleSubmit() {
      const values = await form.validateFields()
      setSubmitting(true)
      try {
        const payload: PermissionForm = { ...values, type: 'MENU' }
        if (mode === 'edit' && editingId) {
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

    return (
      <XnDialog
        title={saveDialogTitle(mode, '菜单权限')}
        open={visible}
        onCancel={() => setVisible(false)}
        destroyOnClose
        width={560}
        confirmText="保存"
        cancelText={mode === 'view' ? '关闭' : '取消'}
        showConfirm={mode !== 'view'}
        confirmLoading={submitting}
        onConfirm={() => void handleSubmit()}
      >
        <Form form={form} labelCol={{ span: 5 }} disabled={mode === 'view'}>
          <Form.Item name="code" label="编码" rules={[{ required: true, message: '请输入编码' }]}>
            <Input disabled={mode === 'edit'} />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="类型">
            <span>菜单</span>
          </Form.Item>
          <Form.Item name="type" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="parentId" label="上级">
            <TreeSelect
              allowClear
              treeDefaultExpandAll
              placeholder="无（顶级）"
              treeData={toTree(tree)}
            />
          </Form.Item>
          <Form.Item name="path" label="路径">
            <Input placeholder="/system/roles" />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </XnDialog>
    )
  },
)

export default PermissionSave
