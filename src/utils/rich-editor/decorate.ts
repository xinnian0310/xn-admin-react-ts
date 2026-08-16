import katex from 'katex'
import 'katex/dist/katex.min.css'
import './styles.css'

/** 只读页把公式 span / 链接卡片渲成可见内容 */
export function decorateRichHtml(html?: string | null): string {
  if (!html) return ''
  if (typeof document === 'undefined') return html
  const box = document.createElement('div')
  box.innerHTML = html
  box.querySelectorAll('[data-w-e-type="formula"]').forEach((el) => {
    const value = el.getAttribute('data-value') || ''
    try {
      el.innerHTML = katex.renderToString(value, { throwOnError: false })
    } catch {
      el.textContent = value
    }
  })
  box.querySelectorAll('[data-w-e-type="link-card"]').forEach((el) => {
    const link = el.getAttribute('data-link')
    if (link) {
      el.setAttribute('role', 'link')
      el.setAttribute('onclick', `window.open(${JSON.stringify(link)},'_blank','noopener')`)
    }
  })
  return box.innerHTML
}
