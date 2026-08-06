import axios from 'axios'
import request, { formatRequestError } from '@/utils/request'
import type { ApiResponse } from '@/types'
import type { SiteContactConfig } from '@/types/site-contact'

/** 公开联系与捐赠（无需鉴权，供首页 / 官网） */
export function getPublicSiteContact() {
  return axios
    .get<ApiResponse<SiteContactConfig>>('/api/site-contact/public', { timeout: 10000 })
    .then((res) => {
      const data = res.data
      if (data.code !== 200) {
        return Promise.reject(new Error(data.message || '获取联系信息失败'))
      }
      return data
    })
    .catch((error) => {
      return Promise.reject(new Error(formatRequestError(error, '获取联系信息失败')))
    })
}

export function getSiteContact() {
  return request.get<any, ApiResponse<SiteContactConfig>>('/site-contact')
}

export function updateSiteContact(data: SiteContactConfig) {
  return request.put<any, ApiResponse<SiteContactConfig>>('/site-contact', data)
}

export function uploadDonationQrcode(file: File) {
  const form = new FormData()
  form.append('file', file)
  return request.post<any, ApiResponse<{ url: string }>>('/site-contact/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
