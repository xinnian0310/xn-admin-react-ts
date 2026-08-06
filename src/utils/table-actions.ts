import type { ButtonListItem } from '@/types/button'

/**
 * 估算操作列宽度：按全部按钮单行排布（不换行）所需宽度。
 * 中文按 14px、西文按 8px，外加按钮间距与单元格内边距。
 */
export function estimateTableActionsWidth(
  items: Array<Pick<ButtonListItem, 'name'> | string> | null | undefined,
): number {
  const names = (items ?? [])
    .map((item) => (typeof item === 'string' ? item : item?.name))
    .filter((name): name is string => !!name && !!String(name).trim())

  if (!names.length) return 100

  const gap = 4
  const cellPadding = 24
  const safety = 12
  let content = 0

  names.forEach((name, index) => {
    let textWidth = 0
    for (const ch of name) {
      textWidth += /[\u4e00-\u9fff]/.test(ch) ? 14 : 8
    }
    // el-button link 左右略有内边距
    content += textWidth + 4
    if (index > 0) content += gap
  })

  return Math.ceil(content + cellPadding + safety) + 50
}
