import type { AttachmentItem, FileInfo } from '@/types'
import { DEFAULT_MAX_FILE_SIZE } from '@/utils/upload/types'
import { formatDateTime } from '@/utils/datetime'

/** 单条业务最多挂这么多附件 */
export const MAX_ATTACHMENT_COUNT = 10

/** 单个附件上限，与上传组件默认一致 */
export const MAX_ATTACHMENT_SIZE = DEFAULT_MAX_FILE_SIZE

/** 附件列表默认露出的行数，超出滚动 */
export const ATTACHMENT_LIST_VISIBLE = 4
export const ATTACHMENT_ROW_HEIGHT = 32
export const ATTACHMENT_ROW_GAP = 6
export const ATTACHMENT_LIST_MAX_HEIGHT =
  ATTACHMENT_LIST_VISIBLE * ATTACHMENT_ROW_HEIGHT +
  Math.max(0, ATTACHMENT_LIST_VISIBLE - 1) * ATTACHMENT_ROW_GAP

type AttachmentSource = {
  attachments?: AttachmentItem[] | null
}

/** 只认 attachments 列表 */
export function resolveAttachments(source?: AttachmentSource | null): AttachmentItem[] {
  if (!source) return []
  if (Array.isArray(source.attachments) && source.attachments.length) {
    return source.attachments.filter((item) => item?.name && item?.path)
  }
  return []
}

export function toAttachmentItem(file: FileInfo): AttachmentItem {
  return {
    name: file.name,
    path: file.path,
    size: file.size,
    uploadedAt: file.lastModified || formatDateTime(new Date()),
  }
}

export function toAttachmentPayload(items: AttachmentItem[]) {
  const attachments = items
    .filter((item) => item?.name && item?.path)
    .map((item) => {
      const next: AttachmentItem = { name: item.name, path: item.path }
      if (item.size != null) next.size = item.size
      if (item.uploadedAt) next.uploadedAt = item.uploadedAt
      return next
    })
  return { attachments }
}

/** 回显已有附件时记下当前顺序，新上传的排在后面 */
export function seedAttachmentOrders(items: AttachmentItem[], pathOrder: Map<string, number>) {
  pathOrder.clear()
  items.forEach((item, index) => {
    if (item?.path) pathOrder.set(item.path, index)
  })
}

/** 按选择/入队顺序插入，避免并发完成打乱列表 */
export function insertAttachmentByOrder(
  list: AttachmentItem[],
  item: AttachmentItem,
  order: number,
  pathOrder: Map<string, number>,
): AttachmentItem[] {
  if (list.some((current) => current.path === item.path)) return list
  pathOrder.set(item.path, order)
  return [...list, item].sort((a, b) => (pathOrder.get(a.path) ?? 0) - (pathOrder.get(b.path) ?? 0))
}
