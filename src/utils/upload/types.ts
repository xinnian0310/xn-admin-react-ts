import type { FileInfo } from '@/types'
import type { ChunkHashAlgo } from '@/api/chunk-upload'
import type { HashMode } from './hash-core'

/**
 * 上传任务状态。
 *
 * `hashing`（算指纹）与 `checking`（探测秒传/续传）都发生在真正传字节之前，
 * 大文件这两步耗时可观，单独成状态才能在界面上给出准确反馈。
 */
export type UploadStatus =
  | 'pending'
  | 'hashing'
  | 'checking'
  | 'uploading'
  | 'paused'
  | 'merging'
  | 'success'
  | 'error'
  | 'cancelled'

export type ChunkStatus = 'pending' | 'uploading' | 'success' | 'error'

export interface UploadChunkState {
  index: number
  size: number
  status: ChunkStatus
  /** 本片已发送字节；失败或重试时归零 */
  loaded: number
  /** 已尝试次数 */
  retries: number
  error?: string
}

export interface UploadTaskSnapshot {
  id: string
  name: string
  size: number
  /** 入队序号，按选择顺序递增；完成先后不影响 */
  queueIndex: number
  status: UploadStatus
  /** 上传进度百分比（0-100，保留一位小数），不含指纹计算阶段 */
  percent: number
  loaded: number
  /** 字节/秒；无有效采样时为 0 */
  speed: number
  /** 预计剩余秒数；无法估算时为 -1 */
  remainingTime: number
  /** 指纹计算进度百分比 */
  hashPercent: number
  /** true 表示命中秒传，未实际传输字节 */
  instant: boolean
  /** 分片上传时为分片数；直传时为 0 */
  totalChunks: number
  uploadedChunks: number
  chunks: UploadChunkState[]
  /** 直传（未分片）时为 true */
  direct: boolean
  uploadId?: string
  error?: string
  result?: FileInfo
}

export interface UploaderOptions {
  /** 分片大小（字节）。MinIO 原生分片要求除末片外 ≥ 5MiB */
  chunkSize: number
  /** 单个文件内同时上传的分片数 */
  concurrency: number
  /** 同时上传的文件数 */
  fileConcurrency: number
  /** 单片自动重试次数（不含首次） */
  maxRetries: number
  /** 首次重试等待毫秒数，后续指数退避 */
  retryDelay: number
  /** 单片请求超时毫秒数；0 表示不限制 */
  chunkTimeout: number
  /** 小于此值直接单请求上传，不走分片 */
  sliceThreshold: number
  /** 关闭后一律直传，仅在明确不需要分片时使用 */
  enableSlice: boolean
  /** 关闭后跳过秒传探测，仍会走续传 */
  enableInstant: boolean
  /** 关闭后不做断点续传，每次都从第 0 片开始 */
  enableResume: boolean
  /** 关闭后不读文件内容算指纹，改用文件名/大小/修改时间派生，秒传随之失效 */
  enableHash: boolean
  /** 指纹算法；enableHash 为 false 时忽略 */
  hashAlgo: Extract<ChunkHashAlgo, 'sha256-tree' | 'sha256'>
  /** 是否随分片提交分片摘要供服务端校验完整性 */
  verifyChunkHash: boolean
}

export interface FileValidateRules {
  /** 单文件最大字节数；0 表示不限 */
  maxSize?: number
  /** 单文件最小字节数 */
  minSize?: number
  /** 允许的类型，支持 `.mp4` / `video/mp4` / `video/*` 三种写法 */
  accept?: string[]
}

export interface HashWorkerRequest {
  file: Blob
  chunkSize: number
  mode: HashMode
}

export type HashWorkerResponse =
  | { type: 'progress'; loaded: number; total: number }
  | { type: 'done'; fileHash: string; chunkHashes: string[] }
  | { type: 'error'; message: string }

/** 组件默认单文件上限 */
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024

export const DEFAULT_UPLOADER_OPTIONS: UploaderOptions = {
  chunkSize: 8 * 1024 * 1024,
  concurrency: 3,
  fileConcurrency: 3,
  maxRetries: 3,
  retryDelay: 1000,
  chunkTimeout: 300000,
  sliceThreshold: 50 * 1024 * 1024,
  enableSlice: true,
  enableInstant: true,
  enableResume: true,
  enableHash: true,
  hashAlgo: 'sha256-tree',
  verifyChunkHash: true,
}
