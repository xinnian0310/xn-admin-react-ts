import { useEffect, useState, type ReactNode } from 'react'
import { Pagination, Segmented, Spin } from 'antd'
import { useLocation } from 'react-router-dom'
import './xnPageLayout.scss'

export type ViewMode = 'table' | 'card'

interface XnPageLayoutProps {
  aside?: ReactNode
  search?: ReactNode
  toolbar?: ReactNode
  toolbarExtra?: ReactNode
  table?: ReactNode
  card?: ReactNode
  pagination?: ReactNode
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  showViewSwitch?: boolean
  showPagination?: boolean
  page?: number
  pageSize?: number
  total?: number
  loading?: boolean
  onPageChange?: (page: number, pageSize: number) => void
  children?: ReactNode
}

export default function XnPageLayout({
  aside,
  search,
  toolbar,
  toolbarExtra,
  table,
  card,
  pagination,
  viewMode: viewModeProp,
  onViewModeChange,
  showViewSwitch = true,
  showPagination = false,
  page = 1,
  pageSize = 10,
  total = 0,
  loading = false,
  onPageChange,
  children,
}: XnPageLayoutProps) {
  const location = useLocation()
  const storageKey = `xn-view-mode:${location.pathname}`
  const [innerMode, setInnerMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved === 'card' ? 'card' : 'table'
    } catch {
      return 'table'
    }
  })

  const viewMode = viewModeProp ?? innerMode

  useEffect(() => {
    if (viewModeProp != null) return
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved === 'card' || saved === 'table') setInnerMode(saved)
    } catch {
      /* ignore */
    }
  }, [storageKey, viewModeProp])

  function changeMode(mode: ViewMode) {
    setInnerMode(mode)
    onViewModeChange?.(mode)
    try {
      localStorage.setItem(storageKey, mode)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={`xn-page-layout${aside ? ' is-with-aside' : ''}`}>
      {aside ? <aside className="xn-page-layout__aside">{aside}</aside> : null}
      <div className="xn-page-layout__main">
        {search ? <div className="xn-page-layout__search">{search}</div> : null}
        <div className="xn-page-layout__toolbar">
          <div className="xn-page-layout__toolbar-left">{toolbar}</div>
          <div className="xn-page-layout__toolbar-right">
            {toolbarExtra}
            {showViewSwitch && card ? (
              <Segmented
                size="small"
                value={viewMode}
                options={[
                  { label: '表格', value: 'table' },
                  { label: '卡片', value: 'card' },
                ]}
                onChange={(v) => changeMode(v as ViewMode)}
              />
            ) : null}
          </div>
        </div>
        <div className="xn-page-layout__body">
          <Spin spinning={loading} wrapperClassName="xn-page-layout__spin-wrap">
            <div className="xn-page-layout__content">
              {viewMode === 'card' && card ? card : table}
              {children}
            </div>
          </Spin>
        </div>
        {showPagination ? (
          <div className="xn-page-layout__pagination">
            {pagination ?? (
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                showTotal={(t) => `共 ${t} 条`}
                onChange={(p, s) => onPageChange?.(p, s)}
              />
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
