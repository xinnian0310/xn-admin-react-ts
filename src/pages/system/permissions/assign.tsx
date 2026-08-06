import { useState } from 'react'
import { Button } from 'antd'
import PermissionAssignPanel from './assign-panel'

/** 基准 assign.vue 对等入口（弹窗版权限分配面板） */
export default function PermissionAssignPage() {
  const [open, setOpen] = useState(false)
  return (
    <div className="page-card">
      <p>该页为权限分配面板入口（通常由权限内容页内嵌调用）。</p>
      <Button type="primary" onClick={() => setOpen(true)}>
        打开示例面板
      </Button>
      <PermissionAssignPanel
        open={open}
        menuId={0}
        menuName="示例菜单"
        onClose={() => setOpen(false)}
      />
    </div>
  )
}
