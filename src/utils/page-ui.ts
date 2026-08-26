import type { ButtonListItem } from '@/types/button'
import type { PageUiButtonItem, PageUiSearchItem } from '@/types/page-ui'
import type { SearchItem } from '@/types/search'
import { resolveIcon } from '@/utils/icons'

export function mapSearchItems(items: PageUiSearchItem[]): SearchItem[] {
  return items.map((item) => ({
    label: item.label,
    prop: item.prop,
    type: item.type,
    placeholder: item.placeholder,
    width: item.width,
    clearable: item.clearable,
    multiple: item.multiple,
    options: item.options,
    dictType: item.dictType,
    level: item.level,
  }))
}

export function mapButtonItems(items: PageUiButtonItem[]): ButtonListItem[] {
  return items.map((item) => ({
    name: item.name,
    type: item.type ?? 'button',
    icon: resolveIcon(item.icon) || item.icon,
    typeColor: item.typeColor as ButtonListItem['typeColor'],
    permission: item.permission,
    index: item.index == null ? undefined : item.index,
    disabled: item.disabled ?? false,
    searchItem: item.searchItem?.map((sub) => ({
      name: sub.name,
      icon: resolveIcon(sub.icon) || sub.icon,
      permission: sub.permission,
      action: sub.action,
    })),
    action: item.action,
  }))
}

/** 从按钮配置解析动作标识，优先 action 字段 */
export function resolveButtonAction(item: ButtonListItem & { action?: string }): string {
  return item.action || item.name
}
