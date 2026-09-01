export interface MyQuota {
  trialEnabled: boolean
  monthlyLimit: number
  monthlyUsed: number
  dailyLimit: number | null
  dailyUsed: number
  currency: string
  estimatedTurnsLeft: number
  maxConcurrency: number
  running: number
  resetAt: string
  exceededTip: string
}

export interface PublicAiSettings {
  maxMessageChars: number
  maxMessagesPerConversation: number
  maxConversationsPerUser: number
  contentSafetyEnabled: boolean
}
