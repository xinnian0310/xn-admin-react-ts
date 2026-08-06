import { useMemo } from 'react'
import { Dropdown, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTagsViewStore } from '@/stores/tagsView'
import type { TagView } from '@/types/menu'
import './xnTagsView.scss'

export default function XnTagsView() {
  const navigate = useNavigate()
  const location = useLocation()
  const visitedViews = useTagsViewStore((s) => s.visitedViews)
  const delView = useTagsViewStore((s) => s.delView)
  const delOthersViews = useTagsViewStore((s) => s.delOthersViews)
  const delAllViews = useTagsViewStore((s) => s.delAllViews)
  const delLeftViews = useTagsViewStore((s) => s.delLeftViews)
  const delRightViews = useTagsViewStore((s) => s.delRightViews)
  const toggleFullscreen = useTagsViewStore((s) => s.toggleFullscreen)

  const active = location.pathname

  const contextMenu = useMemo(() => {
    return (tag: TagView): MenuProps['items'] => [
      {
        key: 'refresh',
        label: '刷新',
        onClick: () => navigate(`/redirect${tag.path}`),
      },
      {
        key: 'close',
        label: '关闭',
        disabled: Boolean(tag.affix),
        onClick: () => {
          delView(tag)
          if (active === tag.path) {
            const views = useTagsViewStore.getState().visitedViews
            const last = views[views.length - 1]
            navigate(last?.path || '/dashboard')
          }
        },
      },
      {
        key: 'closeOthers',
        label: '关闭其他',
        onClick: () => delOthersViews(tag),
      },
      {
        key: 'closeLeft',
        label: '关闭左侧',
        onClick: () => delLeftViews(tag),
      },
      {
        key: 'closeRight',
        label: '关闭右侧',
        onClick: () => delRightViews(tag),
      },
      {
        key: 'closeAll',
        label: '关闭全部',
        onClick: () => {
          delAllViews()
          navigate('/dashboard')
        },
      },
      {
        key: 'fullscreen',
        label: '内容全屏',
        onClick: () => toggleFullscreen(),
      },
    ]
  }, [
    active,
    delAllViews,
    delLeftViews,
    delOthersViews,
    delRightViews,
    delView,
    navigate,
    toggleFullscreen,
  ])

  return (
    <div className="xn-tags-view">
      <div className="xn-tags-view__scroll">
        {visitedViews.map((tag) => (
          <Dropdown key={tag.path} menu={{ items: contextMenu(tag) }} trigger={['contextMenu']}>
            <Tag
              className={active === tag.path ? 'is-active' : ''}
              closable={!tag.affix}
              onClick={() => navigate(tag.path)}
              onClose={(e) => {
                e.preventDefault()
                delView(tag)
                if (active === tag.path) {
                  const views = useTagsViewStore.getState().visitedViews
                  const last = views[views.length - 1]
                  navigate(last?.path || '/dashboard')
                }
              }}
            >
              {tag.title}
            </Tag>
          </Dropdown>
        ))}
      </div>
    </div>
  )
}
