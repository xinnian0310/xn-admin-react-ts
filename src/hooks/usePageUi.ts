import { useCallback, useEffect, useState } from 'react'
import { getPageUiConfig } from '@/api/page-ui'
import type { ButtonListItem } from '@/types/button'
import type { SearchItem } from '@/types/search'
import { mapButtonItems, mapSearchItems } from '@/utils/page-ui'

export function usePageUi(routePath: string) {
  const [searchItems, setSearchItems] = useState<SearchItem[]>([])
  const [buttonItems, setButtonItems] = useState<ButtonListItem[]>([])
  const [tableButtonItems, setTableButtonItems] = useState<ButtonListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activePath, setActivePath] = useState(routePath)

  if (activePath !== routePath) {
    setActivePath(routePath)
    setLoading(true)
  }

  const applyConfig = useCallback((path: string) => {
    return getPageUiConfig(path).then((res) => {
      setSearchItems(mapSearchItems(res.data.searchItems ?? []))
      setButtonItems(mapButtonItems(res.data.buttons ?? []))
      setTableButtonItems(mapButtonItems(res.data.tableButtons ?? []))
    })
  }, [])

  const loadPageUi = useCallback(async () => {
    setLoading(true)
    try {
      await applyConfig(routePath)
    } finally {
      setLoading(false)
    }
  }, [applyConfig, routePath])

  useEffect(() => {
    let cancelled = false
    void applyConfig(routePath)
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [applyConfig, routePath])

  return {
    searchItems,
    buttonItems,
    tableButtonItems,
    loading,
    reloadPageUi: loadPageUi,
    setSearchItems,
  }
}
