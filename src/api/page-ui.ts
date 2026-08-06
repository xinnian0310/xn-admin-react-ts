import request from '@/utils/request'
import type { ApiResponse } from '@/types'
import type { PageUiButtonItem, PageUiConfig, PageUiSearchItem } from '@/types/page-ui'

export function getPageUiConfig(path: string) {
  return request.get<any, ApiResponse<PageUiConfig>>('/page-ui', { params: { path } })
}

export type { PageUiConfig, PageUiSearchItem, PageUiButtonItem }
