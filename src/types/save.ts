export type SaveMode = 'add' | 'edit' | 'view'

export function saveDialogTitle(mode: SaveMode, entity: string) {
  const prefix = { add: '新增', edit: '编辑', view: '查看' }[mode]
  return `${prefix}${entity}`
}

export interface SaveOpenOptions {
  parentId?: number
}
