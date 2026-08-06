export interface RecycleBinItem {
  id: number
  bizType: 'USER' | 'FILE' | string
  bizId: number
  title: string
  summary?: string
  deletedBy?: string
  deletedAt?: string
}
