/** Quartz 6 段：秒 分 时 日 月 周（日/周其一为 ?） */

export type CronFieldKey = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'week'

export type CronFieldMode = 'every' | 'interval' | 'range' | 'specific'

export interface CronFieldState {
  mode: CronFieldMode
  intervalStart: number
  intervalStep: number
  rangeStart: number
  rangeEnd: number
  specific: number[]
}

export const CRON_FIELDS: {
  key: CronFieldKey
  label: string
  min: number
  max: number
}[] = [
  { key: 'second', label: '秒', min: 0, max: 59 },
  { key: 'minute', label: '分', min: 0, max: 59 },
  { key: 'hour', label: '时', min: 0, max: 23 },
  { key: 'day', label: '日', min: 1, max: 31 },
  { key: 'month', label: '月', min: 1, max: 12 },
  { key: 'week', label: '周', min: 1, max: 7 },
]

export const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function emptyField(min: number, max: number): CronFieldState {
  return {
    mode: 'every',
    intervalStart: min,
    intervalStep: 1,
    rangeStart: min,
    rangeEnd: max,
    specific: [],
  }
}

export function defaultCronFields(): Record<CronFieldKey, CronFieldState> {
  const map = {} as Record<CronFieldKey, CronFieldState>
  for (const field of CRON_FIELDS) {
    map[field.key] = emptyField(field.min, field.max)
  }
  map.week.mode = 'every'
  return map
}

export function parseSegment(raw: string, min: number, max: number): CronFieldState {
  const text = (raw || '').trim()
  const next = emptyField(min, max)
  if (!text || text === '*' || text === '?') {
    next.mode = 'every'
    return next
  }
  const interval = text.match(/^(\d+)\/(\d+)$/)
  if (interval) {
    next.mode = 'interval'
    next.intervalStart = clamp(Number(interval[1]), min, max)
    next.intervalStep = Math.max(1, Number(interval[2]))
    return next
  }
  const starInterval = text.match(/^\*\/(\d+)$/)
  if (starInterval) {
    next.mode = 'interval'
    next.intervalStart = min
    next.intervalStep = Math.max(1, Number(starInterval[1]))
    return next
  }
  const range = text.match(/^(\d+)-(\d+)$/)
  if (range) {
    next.mode = 'range'
    next.rangeStart = clamp(Number(range[1]), min, max)
    next.rangeEnd = clamp(Number(range[2]), min, max)
    return next
  }
  if (/^\d+(,\d+)*$/.test(text)) {
    next.mode = 'specific'
    next.specific = text
      .split(',')
      .map((item) => clamp(Number(item), min, max))
      .filter((item, index, list) => list.indexOf(item) === index)
      .sort((a, b) => a - b)
    return next
  }
  if (/^\d+$/.test(text)) {
    next.mode = 'specific'
    next.specific = [clamp(Number(text), min, max)]
  }
  return next
}

export function stringifySegment(state: CronFieldState, min: number): string {
  if (state.mode === 'every') return '*'
  if (state.mode === 'interval') {
    const start = Number.isFinite(state.intervalStart) ? state.intervalStart : min
    const step = Math.max(1, state.intervalStep || 1)
    return start === min ? `*/${step}` : `${start}/${step}`
  }
  if (state.mode === 'range') {
    return `${state.rangeStart}-${state.rangeEnd}`
  }
  if (state.specific.length) return [...state.specific].sort((a, b) => a - b).join(',')
  return '*'
}

export function parseCron(expr: string): Record<CronFieldKey, CronFieldState> {
  const fields = defaultCronFields()
  const parts = (expr || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length < 6) return fields
  CRON_FIELDS.forEach((field, index) => {
    fields[field.key] = parseSegment(parts[index] || '*', field.min, field.max)
  })
  return fields
}

export function stringifyCron(fields: Record<CronFieldKey, CronFieldState>): string {
  const day = stringifySegment(fields.day, 1)
  const week = stringifySegment(fields.week, 1)
  const useWeek = fields.week.mode !== 'every' || (fields.day.mode === 'every' && week !== '*')
  const dayOut = useWeek && fields.day.mode === 'every' ? '?' : day === '*' && useWeek ? '?' : day
  const weekOut = dayOut === '?' ? (week === '*' ? '*' : week) : '?'
  return [
    stringifySegment(fields.second, 0),
    stringifySegment(fields.minute, 0),
    stringifySegment(fields.hour, 0),
    dayOut,
    stringifySegment(fields.month, 1),
    weekOut,
  ].join(' ')
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}
