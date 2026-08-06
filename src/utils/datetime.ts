import dayjs from 'dayjs'

/** 默认日期时间展示格式 */
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'
/** 默认仅日期展示格式 */
export const DATE_FORMAT = 'YYYY-MM-DD'

/** 后端 LocalDateTime / ISO 串：2026-07-13T16:15:13.232337 */
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/

export function isIsoDateTimeLike(value: unknown): value is string {
  return typeof value === 'string' && ISO_DATETIME_RE.test(value.trim())
}

/**
 * 统一时间格式化（dayjs）
 * 空值返回 —；非法值原样返回
 */
export function formatDateTime(
  value?: string | number | Date | null,
  format: string = DATETIME_FORMAT,
): string {
  if (value === null || value === undefined || value === '') return '—'
  const d = dayjs(value)
  return d.isValid() ? d.format(format) : String(value)
}

export function formatDate(
  value?: string | number | Date | null,
  format: string = DATE_FORMAT,
): string {
  return formatDateTime(value, format)
}

/**
 * 递归把对象/数组里的 ISO 时间字符串格式化为可读时间。
 * 在 axios 响应拦截器中调用，保证所有页面拿到的时间字段已格式化。
 */
export function normalizeDateTimes<T>(input: T): T {
  if (input === null || input === undefined) return input

  if (typeof input === 'string') {
    return (isIsoDateTimeLike(input) ? formatDateTime(input) : input) as T
  }

  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i += 1) {
      input[i] = normalizeDateTimes(input[i])
    }
    return input
  }

  if (typeof input === 'object') {
    const obj = input as Record<string, unknown>
    for (const key of Object.keys(obj)) {
      const value = obj[key]
      if (isIsoDateTimeLike(value)) {
        obj[key] = formatDateTime(value)
      } else if (value && typeof value === 'object') {
        normalizeDateTimes(value)
      }
    }
  }

  return input
}
