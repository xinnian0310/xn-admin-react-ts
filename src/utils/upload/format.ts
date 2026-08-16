import type { FileValidateRules } from './types'

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

/** 字节数转可读体积；大文件场景需要覆盖到 GB / TB */
export function formatBytes(bytes: number, fraction = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${unit === 0 ? value : value.toFixed(fraction)} ${UNITS[unit]}`
}

export function formatSpeed(bytesPerSecond: number): string {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return '-'
  return `${formatBytes(bytesPerSecond)}/s`
}

/** 秒数转 mm:ss / h:mm:ss；负数表示无法估算 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '-'
  const total = Math.round(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const pad = (value: number) => String(value).padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${pad(minutes)}:${pad(secs)}`
}

/** accept 支持 `.mp4`（扩展名）/ `video/mp4`（精确 MIME）/ `video/*`（MIME 通配）三种写法 */
export function matchAccept(file: File, accept: string[]): boolean {
  if (accept.length === 0) return true
  const name = file.name.toLowerCase()
  const type = (file.type || '').toLowerCase()
  return accept.some((raw) => {
    const rule = raw.trim().toLowerCase()
    if (!rule) return false
    if (rule.startsWith('.')) return name.endsWith(rule)
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1))
    return type === rule
  })
}

/** 组件层的第一道校验；返回错误文案，通过则返回 null。空文件（0 字节）允许上传。 */
export function validateFile(file: File, rules: FileValidateRules): string | null {
  if (rules.maxSize && file.size > rules.maxSize) {
    return `${file.name}：超过大小上限 ${formatBytes(rules.maxSize)}`
  }
  if (rules.minSize && file.size < rules.minSize) {
    return `${file.name}：小于最小体积 ${formatBytes(rules.minSize)}`
  }
  if (rules.accept?.length && !matchAccept(file, rules.accept)) {
    return `${file.name}：不支持的文件类型（允许 ${rules.accept.join('、')}）`
  }
  return null
}
