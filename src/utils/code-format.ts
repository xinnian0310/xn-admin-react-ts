export type CodeLanguage = 'json' | 'text' | 'java' | 'js' | 'ts'

export type CodeToken = {
  type: 'key' | 'string' | 'number' | 'bool' | 'null' | 'punct' | 'text'
  text: string
}

export function formatCode(value: unknown, language: CodeLanguage = 'text'): string {
  if (value == null) return ''
  if (language === 'json') {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) return ''
      try {
        return JSON.stringify(JSON.parse(trimmed), null, 2)
      } catch {
        return value
      }
    }
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  return typeof value === 'string' ? value : String(value)
}

export function tokenizeJson(source: string): CodeToken[] {
  const tokens: CodeToken[] = []
  const re =
    /("(?:\\.|[^"\\])*")\s*(:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false)\b|\b(null)\b|([{}[\],])|(\s+)|([^\s"{}[\],:]+)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(source))) {
    if (match[1] != null) {
      tokens.push({ type: match[2] ? 'key' : 'string', text: match[1] + (match[2] || '') })
    } else if (match[3] != null) {
      tokens.push({ type: 'number', text: match[3] })
    } else if (match[4] != null) {
      tokens.push({ type: 'bool', text: match[4] })
    } else if (match[5] != null) {
      tokens.push({ type: 'null', text: match[5] })
    } else if (match[6] != null) {
      tokens.push({ type: 'punct', text: match[6] })
    } else if (match[7] != null) {
      tokens.push({ type: 'text', text: match[7] })
    } else if (match[8] != null) {
      tokens.push({ type: 'text', text: match[8] })
    }
  }
  return tokens.length ? tokens : [{ type: 'text', text: source }]
}

export function splitLines(text: string): string[] {
  if (!text) return ['']
  return text.replace(/\r\n/g, '\n').split('\n')
}
