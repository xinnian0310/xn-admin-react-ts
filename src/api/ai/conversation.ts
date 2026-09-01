import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types'
import type {
  ChatMessage,
  Conversation,
  ConversationQuery,
  MessagePage,
} from '@/types/ai/conversation'

export function listConversations(params?: ConversationQuery) {
  return request.get<any, ApiResponse<PageResult<Conversation>>>('/ai/conversations', { params })
}

export function createConversation(data?: { title?: string | null; modelId?: string }) {
  return request.post<any, ApiResponse<Conversation>>('/ai/conversations', data ?? {})
}

export function updateConversation(
  id: string,
  data: { title?: string; pinned?: boolean; modelId?: string | null },
) {
  return request.put<any, ApiResponse<Conversation>>(`/ai/conversations/${id}`, data)
}

export function deleteConversation(id: string) {
  return request.delete<any, ApiResponse<void>>(`/ai/conversations/${id}`)
}

export function listMessages(id: string, params?: { beforeId?: string; size?: number }) {
  return request.get<any, ApiResponse<MessagePage | ChatMessage[]>>(
    `/ai/conversations/${id}/messages`,
    {
      params,
    },
  )
}
