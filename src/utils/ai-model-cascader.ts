export interface ModelCascaderLeaf {
  value: string
  label: string
  disabled?: boolean
  lastCheckOk?: boolean | null
}

export interface ModelCascaderNode {
  value: string
  label: string
  icon?: string
  disabled?: boolean
  lastCheckOk?: boolean | null
  children: ModelCascaderLeaf[]
}

export interface ModelCascaderSource {
  id: string
  name: string
  modelId?: string | null
  modelDisplayName?: string | null
  providerId?: string | null
  providerName?: string | null
  providerIcon?: string | null
  lastCheckOk?: boolean | null
  trial?: boolean
}

function groupCheck(children: ModelCascaderLeaf[]): boolean | null {
  if (children.some((child) => child.lastCheckOk === true)) return true
  if (children.length && children.every((child) => child.lastCheckOk === false)) return false
  return null
}

/** 对话/下拉展示用的模型名：优先用 name，不用 modelId。 */
export function modelVisibleName(model: ModelCascaderSource) {
  const raw = (model.name || model.modelDisplayName || '').trim()
  const base = raw.replace(/（试用）\s*$/g, '').trim()
  if (!base) return ''
  return model.trial ? `${base}（试用）` : base
}

/** 历史消息里可能是「厂商 / 模型名」，展示时去掉厂商。 */
export function chatModelLabel(snapshot?: string | null) {
  if (!snapshot) return '助手'
  const trimmed = snapshot.trim()
  if (!trimmed) return '助手'
  const slash = trimmed.lastIndexOf(' / ')
  return (slash >= 0 ? trimmed.slice(slash + 3) : trimmed).trim() || '助手'
}

/** 厂商为第一级、模型为第二级；模型文案与对话气泡一致，只用模型名称。 */
export function groupModelsByProvider(
  models: ModelCascaderSource[],
  options?: { disableUnavailable?: boolean },
): ModelCascaderNode[] {
  const disableUnavailable = options?.disableUnavailable !== false
  const groups = new Map<string, ModelCascaderNode>()
  for (const model of models) {
    const providerId = model.providerId || model.providerName || '_'
    let group = groups.get(providerId)
    if (!group) {
      group = {
        value: `provider:${providerId}`,
        label: model.providerName || '其他厂商',
        icon: model.providerIcon || undefined,
        children: [],
      }
      groups.set(providerId, group)
    }
    group.children.push({
      value: model.id,
      label: modelVisibleName(model) || model.name,
      lastCheckOk: model.lastCheckOk ?? null,
      disabled: disableUnavailable && model.lastCheckOk === false,
    })
  }
  return [...groups.values()]
    .filter((group) => group.children.length > 0)
    .map((group) => ({
      ...group,
      lastCheckOk: groupCheck(group.children),
    }))
}

export function modelDotClass(ok: boolean | null | undefined) {
  if (ok === true) return 'is-ok'
  if (ok === false) return 'is-fail'
  return 'is-unknown'
}
