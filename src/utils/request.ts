import axios from 'axios'
import { message } from 'antd'
import type { ApiResponse } from '@/types'
import { isApiRegistered, isRegistryLoaded, isWhitelisted } from '@/utils/api-guard'
import { normalizeDateTimes } from '@/utils/datetime'
import { navigateTo } from '@/utils/history'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

const warnedApis = new Set<string>()

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: '请求参数错误',
  401: '登录已过期，请重新登录',
  403: '无权限访问',
  404: '请求的资源不存在',
  405: '请求方法不允许',
  408: '请求超时',
  409: '数据冲突',
  413: '上传内容过大',
  422: '数据校验失败',
  423: '账号已锁定',
  429: '请求过于频繁，请稍后再试',
  500: '服务器内部错误',
  501: '服务未实现',
  502: '网关错误',
  503: '服务暂时不可用，请稍后重试',
  504: '网关超时',
}

/** 将 axios / 业务错误转成中文提示（页面 catch 时可复用） */
export function formatRequestError(error: unknown, fallback = '请求失败'): string {
  if (error == null) return fallback
  if (typeof error === 'string') {
    return localizeAxiosMessage(error) || fallback
  }
  if (!(error instanceof Error) && typeof error !== 'object') {
    return fallback
  }

  const anyErr = error as {
    message?: string
    code?: string
    response?: { status?: number; data?: { message?: string } }
  }

  const bizMsg = anyErr.response?.data?.message
  if (typeof bizMsg === 'string' && bizMsg.trim()) {
    return bizMsg.trim()
  }

  const status = anyErr.response?.status
  if (typeof status === 'number' && HTTP_STATUS_MESSAGES[status]) {
    return HTTP_STATUS_MESSAGES[status]
  }
  if (typeof status === 'number') {
    return `请求失败（${status}）`
  }

  if (anyErr.code === 'ECONNABORTED' || /timeout/i.test(anyErr.message || '')) {
    return '请求超时，请稍后重试'
  }
  if (anyErr.code === 'ERR_NETWORK' || /network error/i.test(anyErr.message || '')) {
    return '网络连接失败，请检查网络或后端服务'
  }

  if (anyErr.message) {
    return localizeAxiosMessage(anyErr.message) || fallback
  }
  return fallback
}

function localizeAxiosMessage(msg: string): string | null {
  const trimmed = msg.trim()
  if (!trimmed) return null

  const statusMatch = trimmed.match(/status code\s+(\d+)/i)
  if (statusMatch) {
    const code = Number(statusMatch[1])
    return HTTP_STATUS_MESSAGES[code] || `请求失败（${code}）`
  }
  if (/network error/i.test(trimmed)) {
    return '网络连接失败，请检查网络或后端服务'
  }
  if (/timeout/i.test(trimmed)) {
    return '请求超时，请稍后重试'
  }
  if (!/^[A-Za-z0-9\s.,:;'"!?()/_-]+$/.test(trimmed)) {
    return trimmed
  }
  if (/request failed/i.test(trimmed) || /failed/i.test(trimmed)) {
    return '请求失败'
  }
  return trimmed
}

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const method = (config.method ?? 'get').toUpperCase()
  const rawUrl = config.url ?? ''
  const path = (rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`).split('?')[0]
  const fullPath = `/api${path}`

  if (isRegistryLoaded() && !isWhitelisted(fullPath) && !isApiRegistered(method, fullPath)) {
    const key = `${method} ${fullPath}`
    if (!warnedApis.has(key)) {
      warnedApis.add(key)
      message.error(`接口未在权限内容中登记，无法访问：${key}`)
    }
    return Promise.reject(new Error(`接口未登记，已拦截：${key}`))
  }

  return config
})

request.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse<unknown>
    if (res.code !== 200) {
      message.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    if (res.data !== undefined) {
      res.data = normalizeDateTimes(res.data)
    }
    return res as unknown as typeof response
  },
  (error) => {
    const status = error.response?.status as number | undefined
    const errMessage = formatRequestError(error)
    if (error && typeof error === 'object') {
      error.message = errMessage
    }

    if (status === 401) {
      void import('@/stores/user').then(({ useUserStore }) => {
        void useUserStore.getState().logout(false)
      })
      navigateTo('/login', { replace: true })
    }

    message.error(errMessage)
    return Promise.reject(error)
  },
)

export default request
