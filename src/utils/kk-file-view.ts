import { resolveAttachmentUrl, resolveStorageBase } from '@/config/app'

/** kkFileView 5.0：url 参数为文件地址的 UTF-8 Base64 */
export function encodeKkFileViewUrl(fileUrl: string): string {
  const bytes = new TextEncoder().encode(fileUrl)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function normalizeServiceBase(serviceBase: string): string {
  const base = (serviceBase || '').trim()
  if (!base) return ''
  return base.endsWith('/') ? base : `${base}/`
}

function hasFileExtension(url: string): boolean {
  try {
    const path = new URL(url, 'http://local.invalid').pathname
    return /\.[A-Za-z0-9]{1,10}$/.test(path)
  } catch {
    return /\.[A-Za-z0-9]{1,10}$/.test(url.split('?')[0] || '')
  }
}

/** 纯函数：拼 kkFileView 5.0 `/onlinePreview` 地址 */
export function buildKkFileViewPreviewUrl(
  serviceBase: string,
  fileUrl: string,
  fileName?: string,
): string {
  const url = (fileUrl || '').trim()
  if (!url) return ''
  const base = normalizeServiceBase(serviceBase)
  if (!base) return url
  const name = (fileName || '').trim()
  let origin = url
  // 只有源地址没有后缀时才补 fullfilename，并且写进文件 URL 再 Base64
  if (name && !hasFileExtension(origin)) {
    origin += `${origin.includes('?') ? '&' : '?'}fullfilename=${encodeURIComponent(name)}`
  }
  return `${base}onlinePreview?url=${encodeURIComponent(encodeKkFileViewUrl(origin))}`
}

export function resolveKkFileViewPreviewUrl(filePath: string, fileName?: string): string {
  return buildKkFileViewPreviewUrl(
    resolveStorageBase('kkFileView'),
    resolveAttachmentUrl(filePath),
    fileName,
  )
}

export function openKkFileViewPreview(filePath: string, fileName?: string) {
  const url = resolveKkFileViewPreviewUrl(filePath, fileName)
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}
