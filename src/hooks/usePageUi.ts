import { useCallback, useEffect, useState } from 'react'
import { getPageUiConfig } from '@/api/page-ui'
import type { ButtonListItem } from '@/types/button'
import type { SearchItem } from '@/types/search'
import { mapButtonItems, mapSearchItems } from '@/utils/page-ui'

export function usePageUi(routePath: string) {
  const [searchItems, setSearchItems] = useState<SearchItem[]>([])
  const [buttonItems, setButtonItems] = useState<ButtonListItem[]>([])
  const [tableButtonItems, setTableButtonItems] = useState<ButtonListItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadPageUi = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getPageUiConfig(routePath)
      setSearchItems(mapSearchItems(res.data.searchItems ?? []))
      setButtonItems(mapButtonItems(res.data.buttons ?? []))
      setTableButtonItems(mapButtonItems(res.data.tableButtons ?? []))
    } finally {
      setLoading(false)
    }
  }, [routePath])

  useEffect(() => {
    void loadPageUi()
  }, [loadPageUi])

  return {
    searchItems,
    buttonItems,
    tableButtonItems,
    loading,
    reloadPageUi: loadPageUi,
    setSearchItems,
  }
}
