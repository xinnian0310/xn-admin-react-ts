import { Avatar, Dropdown, Space, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import {
  BgColorsOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { Modal, message } from 'antd'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useTagsViewStore } from '@/stores/tagsView'
import NoticeInbox from '@/components/NoticeInbox'
import {
  isBrowserFullscreen,
  isFullscreenEnabled,
  toggleBrowserFullscreen,
} from '@/utils/fullscreen'
import { useEffect, useState } from 'react'

export default function LayoutHeaderTools() {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const logout = useUserStore((s) => s.logout)
  const openDialog = useThemeStore((s) => s.openDialog)
  const isFullscreen = useTagsViewStore((s) => s.isFullscreen)
  const toggleFullscreen = useTagsViewStore((s) => s.toggleFullscreen)
  const [browserFs, setBrowserFs] = useState(false)

  useEffect(() => {
    const sync = () => setBrowserFs(isBrowserFullscreen())
    sync()
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  const avatarText = (user?.nickname || user?.username || '?').charAt(0).toUpperCase()

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/profile'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        Modal.confirm({
          title: '确认退出',
          content: '确定退出登录吗？',
          onOk: async () => {
            await logout()
            message.success('已退出登录')
            navigate('/login', { replace: true })
          },
        })
      },
    },
  ]

  return (
    <div className="layout-header-tools">
      <NoticeInbox />
      <Tooltip title={isFullscreen ? '退出内容全屏' : '内容全屏'}>
        <span style={{ cursor: 'pointer' }} onClick={() => toggleFullscreen()}>
          {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
        </span>
      </Tooltip>
      {isFullscreenEnabled() ? (
        <Tooltip title={browserFs ? '退出浏览器全屏' : '浏览器全屏'}>
          <span style={{ cursor: 'pointer' }} onClick={() => void toggleBrowserFullscreen()}>
            {browserFs ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          </span>
        </Tooltip>
      ) : null}
      <Tooltip title="主题设置">
        <BgColorsOutlined style={{ cursor: 'pointer' }} onClick={openDialog} />
      </Tooltip>
      <Dropdown menu={{ items: menuItems }}>
        <Space style={{ cursor: 'pointer' }}>
          <Avatar size={28}>{avatarText}</Avatar>
          <span>{user?.nickname || user?.username}</span>
        </Space>
      </Dropdown>
    </div>
  )
}
