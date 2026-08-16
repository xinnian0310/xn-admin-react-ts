import { Button, Space } from 'antd'
import { EditOutlined, ReloadOutlined } from '@ant-design/icons'
import XnAuth from '@/components/XnAuth'

interface SectionActionsProps {
  editing: boolean
  saving?: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onRefresh: () => void
}

/** 分区级操作条：非编辑态「刷新 / 修改」，编辑态「保存 / 取消」 */
export default function SectionActions({
  editing,
  saving = false,
  onEdit,
  onSave,
  onCancel,
  onRefresh,
}: SectionActionsProps) {
  return (
    <div className="system-config-page__section-actions">
      {editing ? (
        <Space>
          <XnAuth permission="system-config:update">
            <Button type="primary" loading={saving} onClick={onSave}>
              保存
            </Button>
          </XnAuth>
          <Button disabled={saving} onClick={onCancel}>
            取消
          </Button>
        </Space>
      ) : (
        <Space>
          <XnAuth permission="system-config:view">
            <Button icon={<ReloadOutlined />} onClick={onRefresh}>
              刷新
            </Button>
          </XnAuth>
          <XnAuth permission="system-config:update">
            <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
              修改
            </Button>
          </XnAuth>
        </Space>
      )}
    </div>
  )
}
