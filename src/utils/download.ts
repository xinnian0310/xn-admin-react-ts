/** 带鉴权下载文件（绕过 JSON ApiResponse 拦截器） */
export async function downloadWithAuth(url: string, filename: string) {
  const token = localStorage.getItem('token')
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    let message = `导出失败（${res.status}）`
    try {
      const data = (await res.json()) as { message?: string }
      if (data?.message) message = data.message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}

export function buildQueryString(params: Record<string, unknown>): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    qs.set(key, String(value))
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}

/** 将 xnSearch daterange（YYYY-MM-DD[]）转成后端 begin/end ISO 时间 */
export function rangeToBeginEnd(range: unknown): { beginTime?: string; endTime?: string } {
  if (!Array.isArray(range) || range.length < 2) return {}
  const begin = String(range[0] ?? '').trim()
  const end = String(range[1] ?? '').trim()
  return {
    beginTime: begin ? `${begin}T00:00:00` : undefined,
    endTime: end ? `${end}T23:59:59` : undefined,
  }
}
