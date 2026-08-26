import { useEffect, useMemo } from 'react'
import { Layout, Button } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { Outlet } from 'react-router-dom'
import { type LayoutMode } from '@/config/app'
import { useAppConfig } from '@/hooks/useAppConfig'
import { useNoticeStore } from '@/stores/notice'
import { useTagsViewStore } from '@/stores/tagsView'
import { useMenuStore } from '@/stores/menu'
import XnUiPreferenceFab from '@/components/XnUiPreferenceFab'
import XnTagsView from '@/components/XnTagsView'
import XnWatermark from '@/components/XnWatermark'
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
  const appConfig = useAppConfig()
  const mode = appConfig.ui.layout.mode as LayoutMode

  useEffect(() => {
    // 延迟连接，避免 React Strict Mode 先挂再卸时在 CONNECTING 阶段被关掉
    const timer = window.setTimeout(() => {
      startRealtime()
    }, 0)
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useTagsViewStore.getState().isFullscreen) {
        setFullscreen(false)
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKeydown)
      setFullscreen(false)
      stopRealtime()
    }
  }, [setFullscreen, startRealtime, stopRealtime])

  const LayoutComp = useMemo(() => layoutMap[mode] || SideLayout, [mode])

  return (
    <div className={`admin-layout ${isFullscreen ? 'is-fullscreen' : ''}`}>
      <XnWatermark>
        <LayoutComp menus={menus} isFullscreen={isFullscreen}>
          {!isFullscreen ? <XnTagsView /> : null}
          <Layout.Content className="admin-layout__content">
            <div className="admin-layout__page">
              <Outlet />
            </div>
          </Layout.Content>
        </LayoutComp>
      </XnWatermark>
      <XnUiPreferenceFab />
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
