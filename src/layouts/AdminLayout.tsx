import { useEffect, useMemo, useState } from 'react'
import { Layout, Button } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { Outlet } from 'react-router-dom'
import { appConfig, type LayoutMode } from '@/config/app'
import { useNoticeStore } from '@/stores/notice'
import { useTagsViewStore } from '@/stores/tagsView'
import { useMenuStore } from '@/stores/menu'
import UiPreferenceFab from '@/components/UiPreferenceFab'
import XnTagsView from '@/components/XnTagsView'
import SideLayout from './modes/SideLayout'
import TopLayout from './modes/TopLayout'
import MixLayout from './modes/MixLayout'
import ColumnsLayout from './modes/ColumnsLayout'
import './AdminLayout.scss'

const layoutMap: Record<LayoutMode, typeof SideLayout> = {
  side: SideLayout,
  top: TopLayout,
  mix: MixLayout,
  columns: ColumnsLayout,
}

export default function AdminLayout() {
  const isFullscreen = useTagsViewStore((s) => s.isFullscreen)
  const setFullscreen = useTagsViewStore((s) => s.setFullscreen)
  const startRealtime = useNoticeStore((s) => s.startRealtime)
  const stopRealtime = useNoticeStore((s) => s.stopRealtime)
  const menus = useMenuStore((s) => s.menus)
  const [mode, setMode] = useState<LayoutMode>(appConfig.ui.layout.mode)

  // 轮询 appConfig.layout.mode（个人偏好保存后会改 mutable 对象）
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (appConfig.ui.layout.mode !== mode) {
        setMode(appConfig.ui.layout.mode)
      }
    }, 400)
    return () => window.clearInterval(timer)
  }, [mode])

  useEffect(() => {
    startRealtime()
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useTagsViewStore.getState().isFullscreen) {
        setFullscreen(false)
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => {
      window.removeEventListener('keydown', onKeydown)
      setFullscreen(false)
      stopRealtime()
    }
  }, [setFullscreen, startRealtime, stopRealtime])

  const LayoutComp = useMemo(() => layoutMap[mode] || SideLayout, [mode])

  return (
    <div className={`admin-layout ${isFullscreen ? 'is-fullscreen' : ''}`}>
      <LayoutComp menus={menus} isFullscreen={isFullscreen}>
        {!isFullscreen ? <XnTagsView /> : null}
        <Layout.Content className="admin-layout__content">
          <div className="admin-layout__page">
            <Outlet />
          </div>
        </Layout.Content>
      </LayoutComp>
      <UiPreferenceFab />
      {isFullscreen ? (
        <Button
          className="exit-fullscreen"
          icon={<CloseOutlined />}
          onClick={() => setFullscreen(false)}
        >
          退出全屏
        </Button>
      ) : null}
    </div>
  )
}
