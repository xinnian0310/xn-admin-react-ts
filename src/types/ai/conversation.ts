export interface Conversation {
  id: string
  title: string | null
  modelId: string | null
  modelName?: string | null
  pinned: boolean
  messageCount: number
  lastMessageAt: string | null
  createdAt?: string | null
}

export interface ChatMessage {
  id: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  content: string
  thinking?: string
  status: string
  modelSnapshot?: string | null
  providerIcon?: string | null
  parentId?: string | null
  promptTokens?: number | null
  completionTokens?: number | null
  errorCode?: string | null
  createdAt: string
}

export interface ConversationQuery {
  page?: number
  size?: number
}

export interface MessagePage {
  records: ChatMessage[]
  hasMore: boolean
}

export interface ChatFilePayload {
  name: string
  mime: string
  data: string
}

export interface ChatPayload {
  conversationId: string
  modelId?: string
  content: string
  clientMsgId: string
  regenerateOf?: string | null
  editOf?: string | null
  thinking?: boolean
  files?: ChatFilePayload[]
}

export interface ChatMeta {
  streamId: string
  userMessageId: string | null
  assistantMessageId: string
  modelSnapshot: string
  providerIcon?: string | null
  conversationTitle?: string | null
}

export interface ChatHandlers {
  onMeta?: (meta: ChatMeta) => void
  onDelta?: (content: string) => void
  onThinking?: (content: string) => void
  onDone?: (payload: { finishReason: string; usage?: Record<string, unknown> }) => void
  onError?: (code: string, message: string) => void
}
