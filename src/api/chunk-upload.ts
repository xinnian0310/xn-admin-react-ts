import request from '@/utils/request'
import type { ApiResponse, FileInfo } from '@/types'

/**
 * 指纹算法。
 *
 * - `sha256-tree`：各分片摘要拼接后再摘要，全程走原生实现，速度快；取值依赖分片大小。
 * - `sha256`：整文件全量摘要，与 `sha256sum` 一致，但需纯 JS 增量计算，较慢。
 * - `meta`：由文件名/大小/修改时间派生，不读文件内容，秒探测；服务端不会用它做秒传。
 */
export type ChunkHashAlgo = 'sha256-tree' | 'sha256' | 'meta'

export type ChunkUploadSessionStatus = 'UPLOADING' | 'COMPLETED' | 'ABORTED'

export interface ChunkUploadFingerprint {
  fileHash: string
  hashAlgo: ChunkHashAlgo
  fileName: string
  fileSize: number
  chunkSize: number
}

export interface ChunkUploadSession {
  uploadId: string
  fileName: string
  fileSize: number
  chunkSize: number
  totalChunks: number
  /** 已上传分片下标（0 起），由服务端现查存储侧得出 */
  uploadedChunks: number[]
  uploadedBytes: number
  status: ChunkUploadSessionStatus
  storage: string
  /** 服务端要求的最小分片大小 */
  minChunkSize: number
}

export interface ChunkUploadCheckResult {
  exists: boolean
  file?: FileInfo
  session?: ChunkUploadSession
}

export interface ChunkUploadPartResult {
  chunkIndex: number
  etag?: string
  size: number
  totalChunks: number
}

/** 秒传探测；同时返回可续传的会话（若有） */
export function checkChunkUpload(payload: ChunkUploadFingerprint) {
  return request.post<any, ApiResponse<ChunkUploadCheckResult>>('/files/chunk/check', payload)
}

/** 初始化上传；同一用户重复初始化同一文件会复用未完成会话 */
export function initChunkUpload(payload: ChunkUploadFingerprint & { contentType?: string }) {
  return request.post<any, ApiResponse<ChunkUploadSession>>('/files/chunk/init', payload)
}

/** 查询会话状态与已上传分片清单 */
export function getChunkUploadStatus(uploadId: string) {
  return request.get<any, ApiResponse<ChunkUploadSession>>(`/files/chunk/${uploadId}/status`)
}

export interface UploadChunkPartOptions {
  uploadId: string
  chunkIndex: number
  blob: Blob
  chunkHash?: string
  signal?: AbortSignal
  /** 单片超时（毫秒）；0 表示不限制 */
  timeout?: number
  onProgress?: (loaded: number) => void
}

/**
 * 上传单个分片。
 *
 * `silentError` 让失败不弹提示——分片失败会自动重试，逐次弹窗会刷屏，
 * 最终是否提示由上传任务在重试全部失败后决定。
 */
export function uploadChunkPart(options: UploadChunkPartOptions) {
  const form = new FormData()
  form.append('chunkIndex', String(options.chunkIndex))
  if (options.chunkHash) {
    form.append('chunkHash', options.chunkHash)
  }
  // 用固定 ASCII 名，避免中文原名在 multipart 里的编码差异；服务端只认会话里的文件名
  form.append('file', options.blob, `chunk-${options.chunkIndex}.bin`)
  return request.post<any, ApiResponse<ChunkUploadPartResult>>(
    `/files/chunk/${options.uploadId}/part`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal: options.signal,
      timeout: options.timeout ?? 0,
      silentError: true,
      onUploadProgress: (event) => options.onProgress?.(event.loaded),
    },
  )
}

/** 合并分片；幂等，可安全重试。失败不弹提示，由上传任务落到 error 状态后统一展示 */
export function completeChunkUpload(uploadId: string) {
  return request.post<any, ApiResponse<FileInfo>>(`/files/chunk/${uploadId}/complete`, null, {
    timeout: 0,
    silentError: true,
  })
}

/** 取消上传并清理已上传分片 */
export function cancelChunkUpload(uploadId: string) {
  return request.delete<any, ApiResponse<void>>(`/files/chunk/${uploadId}`, { silentError: true })
}
