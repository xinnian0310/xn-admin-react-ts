import { useCallback, useEffect, useRef, useState } from 'react'
import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { LeftOutlined, RightOutlined, CloseOutlined } from '@ant-design/icons'
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showArrows, setShowArrows] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) {
      setShowArrows(false)
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }
    const overflow = el.scrollWidth > el.clientWidth + 1
    setShowArrows(overflow)
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  const scrollActiveIntoView = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    const activeEl = container.querySelector('.xn-tags-view__item.is-active') as HTMLElement | null
    if (!activeEl) {
      updateScrollState()
      return
    }

    const padding = 12
    const cRect = container.getBoundingClientRect()
    const aRect = activeEl.getBoundingClientRect()

    if (aRect.left < cRect.left + padding) {
      container.scrollBy({ left: aRect.left - cRect.left - padding, behavior: 'smooth' })
    } else if (aRect.right > cRect.right - padding) {
      container.scrollBy({ left: aRect.right - cRect.right + padding, behavior: 'smooth' })
    }
    updateScrollState()
  }, [updateScrollState])

  const scheduleScrollActiveIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollActiveIntoView)
    })
  }, [scrollActiveIntoView])

  useEffect(() => {
    scheduleScrollActiveIntoView()
  }, [active, visitedViews.length, scheduleScrollActiveIntoView])

  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    let observer: ResizeObserver | null = null
    if (el && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateScrollState())
      observer.observe(el)
    }
    window.addEventListener('resize', updateScrollState)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState])

  function scrollBy(direction: -1 | 1) {
    const el = scrollRef.current
    if (!el) return
    const step = Math.max(160, Math.floor(el.clientWidth * 0.6))
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  const closeTag = useCallback(
    (tag: TagView) => {
      const views = useTagsViewStore.getState().visitedViews
      const index = views.findIndex((v) => v.path === tag.path)
      delView(tag)
      if (active !== tag.path) {
        scheduleScrollActiveIntoView()
        return
      }
      if (views.length <= 1) {
        navigate('/dashboard')
        return
      }
      const nextTag = views[index + 1] || views[index - 1]
      navigate(nextTag?.path || '/dashboard')
    },
    [active, delView, navigate, scheduleScrollActiveIntoView],
  )

  const contextMenu = useCallback(
    (tag: TagView): MenuProps['items'] => [
      {
        key: 'refresh',
        label: '刷新',
        onClick: () => navigate(`/redirect${tag.path}`),
      },
      {
        key: 'close',
        label: '关闭',
        disabled: Boolean(tag.affix),
        onClick: () => closeTag(tag),
      },
      {
        key: 'closeOthers',
        label: '关闭其他',
        onClick: () => {
          delOthersViews(tag)
          scheduleScrollActiveIntoView()
        },
      },
      {
        key: 'closeLeft',
        label: '关闭左侧',
        onClick: () => {
          delLeftViews(tag)
          scheduleScrollActiveIntoView()
        },
      },
      {
        key: 'closeRight',
        label: '关闭右侧',
        onClick: () => {
          delRightViews(tag)
          scheduleScrollActiveIntoView()
        },
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
    ],
    [
      closeTag,
      delAllViews,
      delLeftViews,
      delOthersViews,
      delRightViews,
      navigate,
      scheduleScrollActiveIntoView,
      toggleFullscreen,
    ],
  )

  return (
    <div className="xn-tags-view">
      {showArrows ? (
        <button
          type="button"
          className="xn-tags-view__arrow"
          disabled={!canScrollLeft}
          title="向左"
          onClick={() => scrollBy(-1)}
        >
          <LeftOutlined />
        </button>
      ) : null}

      <div ref={scrollRef} className="xn-tags-view__scroll" onScroll={updateScrollState}>
        {visitedViews.map((tag) => (
          <Dropdown key={tag.path} menu={{ items: contextMenu(tag) }} trigger={['contextMenu']}>
            <div
              className={`xn-tags-view__item${active === tag.path ? ' is-active' : ''}`}
              onClick={() => {
                if (active !== tag.path) navigate(tag.path)
              }}
            >
              <span className="xn-tags-view__title">{tag.title}</span>
              {!tag.affix ? (
                <CloseOutlined
                  className="xn-tags-view__close"
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTag(tag)
                  }}
                />
              ) : null}
            </div>
          </Dropdown>
        ))}
      </div>

      {showArrows ? (
        <button
          type="button"
          className="xn-tags-view__arrow"
          disabled={!canScrollRight}
          title="向右"
          onClick={() => scrollBy(1)}
        >
          <RightOutlined />
        </button>
      ) : null}
    </div>
  )
}
