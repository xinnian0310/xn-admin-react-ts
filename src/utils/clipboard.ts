/** 复制文本到剪贴板，优先 Clipboard API，失败则走 execCommand。 */
export async function copyText(text: string): Promise<boolean> {
  const value = String(text ?? '')
  if (!value) return false
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    /* fallback */
  }
  const el = document.createElement('textarea')
  el.value = value
  el.setAttribute('readonly', 'true')
  el.style.position = 'fixed'
  el.style.left = '-9999px'
  el.style.top = '0'
  document.body.appendChild(el)
  el.select()
  el.setSelectionRange(0, value.length)
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  document.body.removeChild(el)
  return ok
}
