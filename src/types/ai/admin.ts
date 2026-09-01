export interface ProviderPricing {
  inputMiss?: number | null
  inputHit?: number | null
  output?: number | null
  offpeakRatio?: number | null
  peakWindows?: string | null
}

export interface AdminProviderModel {
  id: string
  modelId: string
  displayName: string
  contextTokens: number
  defaultMaxOutput: number
  defaultBudgetTokens?: number | null
  status: number
  sort: number
  supportsUsageStream: number
  supportsThinking?: boolean
  supportsFiles?: boolean
  updatedAt?: string | null
  pricing: ProviderPricing
}

export interface AdminProvider {
  id: string
  name: string
  code: string
  baseUrl: string
  docUrl?: string
  keyHint?: string
  icon?: string
  status: number
  sort: number
  updatedAt?: string | null
  models: AdminProviderModel[]
  keyConfigured?: boolean
  keyMask?: string | null
  lastCheckOk?: boolean | null
  lastCheckAt?: string | null
}

export interface AdminTrial {
  enabled: boolean
  name: string
  sourceModelId?: string | null
  providerModelId: string | null
  providerName?: string | null
  modelId?: string | null
  apiKey: null
  apiKeyMask?: string | null
  keyConfigured?: boolean
  contextTokens?: number | null
  budgetTokens?: number | null
  maxOutputTokens?: number | null
  temperature?: number | null
  timeoutSeconds?: number | null
  defaultQuota: {
    monthlyAmount: number
    dailyAmount: number | null
    currency: string
    maxConcurrency: number
  }
}

export interface AdminSettings {
  trialEnabled: boolean
  systemPrompt?: string | null
  quotaExceededTip: string
  contentSafetyEnabled: boolean
  maxMessageChars?: number
  maxMessagesPerConversation?: number
  maxConversationsPerUser?: number
}

export interface ProbeResult {
  ok: boolean
  latencyMs: number
  supportsUsageStream: boolean | null
  message: string | null
}

export interface AdminQuotaRow {
  userId: string
  username: string
  nickname?: string | null
  unitName?: string | null
  monthlyLimit: number
  monthlyUsed: number
  dailyLimit: number | null
  dailyUsed: number
  currency: string
  promptTokens: number
  completionTokens: number
  maxConcurrency: number
  requestCount: number
  blockedCount: number
  estimatedRatio: number
  trialEnabled: boolean
  hasOverride: boolean
}

export interface AdminQuotaWrite {
  monthlyAmount?: number
  dailyAmount?: number | null
  maxConcurrency?: number
  trialEnabled?: boolean
}

export interface AdminQuotaSummary {
  month: string
  totalCost: number
  userCount: number
  requestCount: number
  estimatedRatio: number
}

export interface AdminSensitiveWord {
  id: string
  word: string
  category?: string | null
  action: string
  status: number
}
