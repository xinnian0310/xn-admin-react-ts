export interface TrialQuota {
  monthlyLimit: number
  monthlyUsed: number
  dailyLimit: number | null
  dailyUsed: number
  currency: string
  maxConcurrency: number
}

export interface TrialModel {
  id: string
  name: string
  modelId: string
  modelDisplayName?: string
  providerId?: string
  providerName?: string
  providerIcon?: string
  contextTokens: number
  budgetTokens?: number | null
  editable: boolean
  quota: TrialQuota
  lastCheckOk?: boolean | null
  supportsThinking?: boolean
  supportsFiles?: boolean
}

export interface MineModel {
  id: string
  name: string
  providerModelId: string
  providerId?: string
  providerName: string
  providerIcon?: string
  modelDisplayName: string
  modelId: string
  apiKeyMask: string
  contextTokens: number
  budgetTokens: number | null
  maxOutputTokens: number
  temperature: number
  timeoutSeconds: number
  monthCost: number
  status: number
  lastCheckOk: boolean | null
  lastCheckAt: string | null
  supportsThinking?: boolean
  supportsFiles?: boolean
}

export interface ModelListData {
  trial: TrialModel | null
  mine: MineModel[]
  available?: boolean
  unavailableCode?: string
  unavailableMessage?: string
}

export interface ProviderCatalogModel {
  id: string
  modelId: string
  displayName: string
  contextTokens: number
  defaultMaxOutput: number
  defaultBudgetTokens?: number | null
  supportsThinking?: boolean
  supportsFiles?: boolean
}

export interface ProviderKeyCheck {
  id: string
  keyConfigured?: boolean
  keyMask?: string
  lastCheckOk?: boolean | null
  lastCheckAt?: string | null
}

export interface ProviderCatalog {
  id: string
  name: string
  code: string
  docUrl?: string
  keyHint?: string
  icon?: string
  baseUrl?: string
  keyConfigured?: boolean
  keyMask?: string
  lastCheckOk?: boolean | null
  lastCheckAt?: string | null
  models: ProviderCatalogModel[]
}

export interface RemoteModelItem {
  modelId: string
  displayName: string
  contextTokens: number
  catalogId?: string | null
  boundId?: string
  name?: string
  apiKeyMask?: string
  lastCheckOk?: boolean | null
  lastCheckAt?: string | null
  status?: number
}

export interface RemoteModelList {
  source?: string
  message?: string | null
  models: RemoteModelItem[]
  keyMask?: string
  keyConfigured?: boolean
  lastCheckOk?: boolean | null
  lastCheckAt?: string | null
}

export interface ModelForm {
  providerModelId?: string
  providerId?: string
  modelId?: string
  name?: string
  apiKey?: string
  maxOutputTokens?: number
  budgetTokens?: number | null
  temperature?: number
  timeoutSeconds?: number
  status?: number
}
