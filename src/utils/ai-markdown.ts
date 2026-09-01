/** 先转义再套 Markdown，避免模型返回的 HTML / 脚本被执行。 */
export function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function splitThink(source: string): { thinking: string; answer: string } {
  if (!source) return { thinking: '', answer: '' }
  const match = source.match(/^<think>\s*([\s\S]*?)\s*<\/think>\s*/)
  if (!match) return { thinking: '', answer: source }
  return { thinking: match[1], answer: source.slice(match[0].length) }
}

function inline(text: string) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)\*([^*]+)\*(?=\s|$)/g, '$1<em>$2</em>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
    )
}

export function renderMarkdown(source: string) {
  if (!source) return ''
  const fences: string[] = []
  const withFences = source.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_m, lang, code) => {
    const idx = fences.length
    const safeLang = String(lang || '').replace(/[^a-zA-Z0-9_-]/g, '')
    const raw = String(code).replace(/\n$/, '')
    fences.push(
      `<div class="ai-code"><button type="button" class="ai-code__copy">复制</button><pre><code class="lang-${safeLang}">${highlightCode(raw, safeLang)}</code></pre></div>`,
    )
    return `\u0000FENCE${idx}\u0000`
  })

  const lines = withFences.split('\n')
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const fence = line.match(/^\u0000FENCE(\d+)\u0000$/)
    if (fence) {
      out.push(fences[Number(fence[1])])
      i++
      continue
    }
    if (/^\s*\|.+\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*-+/.test(lines[i + 1])) {
      const rows: string[] = [line]
      i++
      i++
      while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) {
        rows.push(lines[i])
        i++
      }
      out.push(renderTable(rows))
      continue
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line)
    if (heading) {
      const level = heading[1].length
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`)
      i++
      continue
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ''))}</li>`)
        i++
      }
      out.push(`<ul>${items.join('')}</ul>`)
      continue
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ''))}</li>`)
        i++
      }
      out.push(`<ol>${items.join('')}</ol>`)
      continue
    }
    if (!line.trim()) {
      i++
      continue
    }
    const para: string[] = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s+|```|\s*[-*]\s+|\s*\d+\.\s+)/.test(lines[i])
    ) {
      para.push(lines[i])
      i++
    }
    out.push(`<p>${inline(para.join('\n')).replace(/\n/g, '<br>')}</p>`)
  }
  return out.join('')
}

const KEYWORDS: Record<string, string[]> = {
  js: [
    'const',
    'let',
    'var',
    'function',
    'return',
    'if',
    'else',
    'for',
    'while',
    'class',
    'import',
    'export',
    'from',
    'async',
    'await',
    'new',
    'try',
    'catch',
  ],
  ts: [
    'const',
    'let',
    'var',
    'function',
    'return',
    'if',
    'else',
    'for',
    'class',
    'import',
    'export',
    'from',
    'async',
    'await',
    'type',
    'interface',
  ],
  java: [
    'public',
    'private',
    'protected',
    'class',
    'interface',
    'return',
    'if',
    'else',
    'for',
    'new',
    'void',
    'static',
    'final',
    'import',
    'package',
    'try',
    'catch',
  ],
  py: [
    'def',
    'return',
    'if',
    'elif',
    'else',
    'for',
    'while',
    'class',
    'import',
    'from',
    'as',
    'try',
    'except',
    'with',
    'lambda',
  ],
  python: [
    'def',
    'return',
    'if',
    'elif',
    'else',
    'for',
    'while',
    'class',
    'import',
    'from',
    'as',
    'try',
    'except',
    'with',
  ],
  sql: [
    'select',
    'from',
    'where',
    'and',
    'or',
    'insert',
    'update',
    'delete',
    'into',
    'values',
    'join',
    'left',
    'right',
    'on',
    'group',
    'order',
    'by',
  ],
  json: [],
}

function highlightCode(source: string, lang: string) {
  let escaped = escapeHtml(source)
  escaped = escaped.replace(/(^|[^:])\/\/.*$/gm, (m) => `<span class="ai-cm">${m}</span>`)
  escaped = escaped.replace(
    /(&quot;|&#39;)(?:\\.|(?!\1).)*\1/g,
    (m) => `<span class="ai-str">${m}</span>`,
  )
  const words = KEYWORDS[lang] || KEYWORDS[lang.replace('javascript', 'js')] || []
  for (const word of words) {
    escaped = escaped.replace(
      new RegExp(`(?<![\\w-])(${word})(?![\\w-])`, 'g'),
      '<span class="ai-kw">$1</span>',
    )
  }
  return escaped
}

function renderTable(rows: string[]) {
  const cells = (row: string) =>
    row
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim())
  const head = cells(rows[0])
  const body = rows.slice(1).map(cells)
  return `<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body
    .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`
}
