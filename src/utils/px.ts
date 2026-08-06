/** 从 "14px" / "14" 解析正整数，失败返回 fallback */
export function parsePxInt(value: string | null | undefined, fallback = 14): number {
  if (!value) return fallback
  const n = Number.parseInt(String(value).replace(/px/gi, '').trim(), 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/** 正整数 → "Npx" */
export function toPx(value: number | null | undefined, fallback = 14): string {
  const n = Math.floor(Number(value))
  return `${Number.isFinite(n) && n > 0 ? n : fallback}px`
}
