import { forwardRef, useImperativeHandle, useState } from 'react'
import { Result } from 'antd'
import XnDialog from '@/components/XnDialog'
import type { SaveMode } from '@/types/save'

export interface DashboardSaveHandle {
  open: (mode?: SaveMode) => void
}

/** 路由规范占位：首页无需编辑 */
const DashboardSave = forwardRef<DashboardSaveHandle>(function DashboardSave(_, ref) {
  const [visible, setVisible] = useState(false)

  useImperativeHandle(ref, () => ({
    open(_mode: SaveMode = 'view') {
      setVisible(true)
    },
  }))

  return (
    <XnDialog
      title="首页"
      open={visible}
      onCancel={() => setVisible(false)}
      width={480}
      showConfirm={false}
      cancelText="关闭"
    >
      <Result status="info" title="首页无需编辑" subTitle="此弹窗为路由规范占位" />
    </XnDialog>
  )
})

export default DashboardSave
