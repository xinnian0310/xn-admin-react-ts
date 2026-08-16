import request from '@/utils/request'
import type { ApiResponse } from '@/types'

export type AttachmentUploadResult = {
  fileName: string
  filePath: string
}

/** 业务附件上传：只返回文件名 + 对象路径 */
export function uploadAttachment(file: File) {
  const form = new FormData()
  form.append('file', file)
  return request.post<any, ApiResponse<AttachmentUploadResult>>('/attachments/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
