import request from '@/utils/request'
import type {
  ApiResponse,
  Message,
  MessageForm,
  MessageReader,
  MessageSendForm,
  MyMessage,
  PageResult,
} from '@/types'

export type MessageListParams = {
  page: number
  size: number
  keyword?: string
  status?: string
}

export function list(params?: MessageListParams) {
  return request.get<any, ApiResponse<PageResult<Message>>>('/messages', { params })
}

export function get(id: number) {
  return request.get<any, ApiResponse<Message>>(`/messages/${id}`)
}

export function create(data: MessageForm) {
  return request.post<any, ApiResponse<Message>>('/messages', data)
}

export function update(id: number, data: MessageForm) {
  return request.put<any, ApiResponse<Message>>(`/messages/${id}`, data)
}

export function remove(id: number) {
  return request.delete<any, ApiResponse<null>>(`/messages/${id}`)
}

export function batchRemove(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/messages/batch-delete', { ids })
}

export function send(id: number, data: MessageSendForm) {
  return request.post<any, ApiResponse<Message>>(`/messages/${id}/send`, data)
}

export function readers(id: number) {
  return request.get<any, ApiResponse<MessageReader[]>>(`/messages/${id}/readers`)
}

export function listMine() {
  return request.get<any, ApiResponse<MyMessage[]>>('/messages/mine')
}

export function markRead(id: number) {
  return request.post<any, ApiResponse<null>>(`/messages/${id}/read`)
}

export function unreadCount() {
  return request.get<any, ApiResponse<{ count: number }>>('/messages/unread-count')
}

export function removeMine(id: number) {
  return request.delete<any, ApiResponse<null>>(`/messages/mine/${id}`)
}

export function batchRemoveMine(ids: number[]) {
  return request.post<any, ApiResponse<{ count: number }>>('/messages/mine/batch-delete', { ids })
}
