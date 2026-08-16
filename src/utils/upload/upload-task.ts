import {
  cancelChunkUpload,
  checkChunkUpload,
  completeChunkUpload,
  getChunkUploadStatus,
  initChunkUpload,
  uploadChunkPart,
} from '@/api/chunk-upload'
import type { ChunkHashAlgo, ChunkUploadSession } from '@/api/chunk-upload'
import { uploadFile } from '@/api/file-job'
import type { FileInfo } from '@/types'
import { formatRequestError } from '@/utils/request'
import { hashFile, isHashAborted, metaFingerprint } from './file-hash'
import type { UploadChunkState, UploadStatus, UploadTaskSnapshot, UploaderOptions } from './types'

/** 暂停 / 取消是预期中的中断，用哨兵错误跳出流程，不当成失败 */
const PAUSED = 'UPLOAD_PAUSED'
const CANCELLED = 'UPLOAD_CANCELLED'

const SPEED_WINDOW_MS = 4000
const EMIT_INTERVAL_MS = 150

let taskSeq = 0

/**
 * 单个文件的上传任务：算指纹 → 秒传/续传探测 → 初始化 → 并发传分片（失败指数退避重试）→ 合并。
 *
 * 小于阈值的文件直接走单请求上传，调用方无需区分。
 */
export class UploadTask {
  readonly id: string
  readonly file: File
  /** 入队序号，按选择顺序递增 */
  readonly queueIndex: number

  private readonly options: UploaderOptions
  private readonly notify: (task: UploadTask) => void

  private status: UploadStatus = 'pending'
  private chunks: UploadChunkState[] = []
  private chunkHashes: string[] = []
  private fingerprint: { fileHash: string; hashAlgo: ChunkHashAlgo } | null = null
  private hashPercent = 0
  private instant = false
  private direct = false
  private directLoaded = 0
  private uploadId: string | undefined
  private errorMessage: string | undefined
  private result: FileInfo | undefined

  private hashController: AbortController | null = null
  private readonly inflight = new Map<number, AbortController>()
  private pauseRequested = false
  private cancelRequested = false
  private running = false

  private samples: { at: number; loaded: number }[] = []
  private lastEmitAt = 0

  constructor(file: File, options: UploaderOptions, notify: (task: UploadTask) => void) {
    taskSeq += 1
    this.id = `upload-${Date.now()}-${taskSeq}`
    this.queueIndex = taskSeq
    this.file = file
    this.options = options
    this.notify = notify
  }

  // ------------------------------------------------------------------ 对外操作

  async start(): Promise<void> {
    if (this.running || this.status === 'success' || this.status === 'cancelled') return
    this.running = true
    this.pauseRequested = false
    this.cancelRequested = false
    this.errorMessage = undefined
    this.samples = []

    try {
      if (this.shouldUploadDirectly()) {
        await this.runDirect()
      } else {
        await this.runChunked()
      }
    } catch (error) {
      if (this.cancelRequested || isSentinel(error, CANCELLED)) {
        this.setStatus('cancelled')
      } else if (this.pauseRequested || isSentinel(error, PAUSED)) {
        this.setStatus('paused')
      } else {
        this.errorMessage = formatRequestError(error, '上传失败')
        this.setStatus('error')
      }
    } finally {
      this.running = false
      this.emit(true)
    }
  }

  /** 暂停：中断进行中的请求，已传成功的分片保留，不会重传 */
  pause(): void {
    if (this.status === 'success' || this.status === 'cancelled' || this.status === 'error') return
    this.pauseRequested = true
    this.abortInflight()
    if (!this.running) {
      this.setStatus('paused')
    }
  }

  resume(): void {
    if (this.status !== 'paused') return
    void this.start()
  }

  /** 重试：只重发失败的分片；若失败发生在合并阶段则重新合并 */
  retry(): void {
    if (this.status !== 'error' && this.status !== 'paused') return
    for (const chunk of this.chunks) {
      if (chunk.status === 'error') {
        chunk.status = 'pending'
        chunk.loaded = 0
        chunk.retries = 0
        chunk.error = undefined
      }
    }
    void this.start()
  }

  async cancel(): Promise<void> {
    if (this.status === 'success') return
    this.cancelRequested = true
    this.abortInflight()
    this.setStatus('cancelled')
    const uploadId = this.uploadId
    this.uploadId = undefined
    if (uploadId) {
      try {
        await cancelChunkUpload(uploadId)
      } catch {
        // 会话可能已被服务端清理，取消是终态操作，失败无需打扰用户
      }
    }
  }

  snapshot(): UploadTaskSnapshot {
    const loaded = this.currentLoaded()
    const speed = this.currentSpeed()
    return {
      id: this.id,
      name: this.file.name,
      size: this.file.size,
      queueIndex: this.queueIndex,
      status: this.status,
      percent:
        this.file.size > 0
          ? round1((loaded / this.file.size) * 100)
          : this.status === 'success'
            ? 100
            : 0,
      loaded,
      speed,
      remainingTime: speed > 0 ? Math.round((this.file.size - loaded) / speed) : -1,
      hashPercent: round1(this.hashPercent),
      instant: this.instant,
      totalChunks: this.chunks.length,
      uploadedChunks: this.chunks.filter((chunk) => chunk.status === 'success').length,
      chunks: this.chunks.map((chunk) => ({ ...chunk })),
      direct: this.direct,
      uploadId: this.uploadId,
      error: this.errorMessage,
      result: this.result,
    }
  }

  get currentStatus(): UploadStatus {
    return this.status
  }

  get isRunning(): boolean {
    return this.running
  }

  get isSettled(): boolean {
    return this.status === 'success' || this.status === 'cancelled'
  }

  // ------------------------------------------------------------------ 直传

  private shouldUploadDirectly(): boolean {
    return !this.options.enableSlice || this.file.size < this.options.sliceThreshold
  }

  private async runDirect(): Promise<void> {
    this.direct = true
    this.setStatus('uploading')
    const controller = new AbortController()
    this.inflight.set(-1, controller)
    try {
      const response = await uploadFile(this.file, undefined, {
        signal: controller.signal,
        timeout: this.options.chunkTimeout,
        silentError: true,
        onProgress: (loaded) => {
          this.directLoaded = loaded
          this.emit()
        },
      })
      this.result = response.data
      this.directLoaded = this.file.size
      this.setStatus('success')
    } finally {
      this.inflight.delete(-1)
    }
  }

  // ------------------------------------------------------------------ 分片

  private async runChunked(): Promise<void> {
    await this.ensureFingerprint()
    this.throwIfInterrupted()

    const session = await this.resolveSession()
    if (!session) return

    this.uploadId = session.uploadId
    this.applySession(session)
    this.setStatus('uploading')
    await this.runChunkQueue()
    this.throwIfInterrupted()
    await this.mergeChunks()
  }

  private async ensureFingerprint(): Promise<void> {
    if (this.fingerprint) return
    const chunkSize = this.options.chunkSize

    if (!this.options.enableHash) {
      this.fingerprint = { fileHash: metaFingerprint(this.file, chunkSize), hashAlgo: 'meta' }
      this.chunkHashes = []
      this.hashPercent = 100
      return
    }

    this.setStatus('hashing')
    this.hashController = new AbortController()
    try {
      const result = await hashFile({
        file: this.file,
        chunkSize,
        mode: this.options.hashAlgo === 'sha256' ? 'full' : 'tree',
        signal: this.hashController.signal,
        onProgress: (percent) => {
          this.hashPercent = percent
          this.emit()
        },
      })
      this.fingerprint = { fileHash: result.fileHash, hashAlgo: this.options.hashAlgo }
      this.chunkHashes = result.chunkHashes
      this.hashPercent = 100
    } finally {
      this.hashController = null
    }
  }

  /** 返回 null 表示无需上传（已秒传或已完成） */
  private async resolveSession(): Promise<ChunkUploadSession | null> {
    const chunkSize = this.options.chunkSize
    const fingerprint = this.fingerprint
    if (!fingerprint) throw new Error('缺少文件指纹')

    // 续传：本地已有会话，直接以服务端最新状态为准
    if (this.uploadId) {
      const status = (await getChunkUploadStatus(this.uploadId)).data
      if (status.status === 'UPLOADING') return status
      if (status.status === 'COMPLETED') {
        this.applySession(status)
        await this.mergeChunks()
        return null
      }
      this.uploadId = undefined
    }

    const payload = {
      ...fingerprint,
      fileName: this.file.name,
      fileSize: this.file.size,
      chunkSize,
    }

    if (this.options.enableInstant || this.options.enableResume) {
      this.setStatus('checking')
      const check = (await checkChunkUpload(payload)).data
      if (this.options.enableInstant && check.exists && check.file) {
        this.instant = true
        this.result = check.file
        this.setStatus('success')
        return null
      }
      if (this.options.enableResume && check.session?.status === 'UPLOADING') {
        return check.session
      }
    }

    return (await initChunkUpload({ ...payload, contentType: this.file.type })).data
  }

  private applySession(session: ChunkUploadSession): void {
    if (session.chunkSize !== this.options.chunkSize) {
      throw new Error(
        `服务端分片大小（${session.chunkSize}）与本地配置（${this.options.chunkSize}）不一致，请重新上传`,
      )
    }
    const uploaded = new Set(this.options.enableResume ? session.uploadedChunks : [])
    this.chunks = []
    for (let index = 0; index < session.totalChunks; index++) {
      const size = this.chunkSizeAt(index)
      const done = uploaded.has(index)
      this.chunks.push({
        index,
        size,
        status: done ? 'success' : 'pending',
        loaded: done ? size : 0,
        retries: 0,
      })
    }
  }

  private chunkSizeAt(index: number): number {
    const offset = index * this.options.chunkSize
    return Math.min(this.options.chunkSize, this.file.size - offset)
  }

  /** 固定并发数的分片队列：worker 数即并发数，共享同一份待传下标 */
  private async runChunkQueue(): Promise<void> {
    const queue = this.chunks
      .filter((chunk) => chunk.status !== 'success')
      .map((chunk) => chunk.index)
    if (queue.length === 0) return

    const failures: unknown[] = []
    const concurrency = Math.max(1, Math.min(this.options.concurrency, queue.length))
    const workers = Array.from({ length: concurrency }, async () => {
      while (failures.length === 0 && !this.pauseRequested && !this.cancelRequested) {
        const index = queue.shift()
        if (index === undefined) return
        try {
          await this.uploadChunkWithRetry(index)
        } catch (error) {
          failures.push(error)
        }
      }
    })
    await Promise.all(workers)

    if (failures.length > 0) throw failures[0]
  }

  private async uploadChunkWithRetry(index: number): Promise<void> {
    const chunk = this.chunks[index]
    const start = index * this.options.chunkSize
    const blob = this.file.slice(start, start + chunk.size)

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      if (this.pauseRequested || this.cancelRequested) return
      const controller = new AbortController()
      this.inflight.set(index, controller)
      chunk.status = 'uploading'
      chunk.loaded = 0
      try {
        await uploadChunkPart({
          uploadId: this.uploadId as string,
          chunkIndex: index,
          blob,
          chunkHash: this.options.verifyChunkHash ? this.chunkHashes[index] : undefined,
          signal: controller.signal,
          timeout: this.options.chunkTimeout,
          onProgress: (loaded) => {
            chunk.loaded = loaded
            this.emit()
          },
        })
        chunk.status = 'success'
        chunk.loaded = chunk.size
        chunk.error = undefined
        this.emit()
        return
      } catch (error) {
        chunk.loaded = 0
        if (isAbortError(error)) {
          // 暂停 / 取消打断的请求不算失败，恢复后重新排队即可
          chunk.status = 'pending'
          return
        }
        chunk.retries = attempt + 1
        chunk.error = formatRequestError(error, '分片上传失败')
        if (attempt >= this.options.maxRetries) {
          chunk.status = 'error'
          this.emit(true)
          throw error
        }
        this.emit(true)
        await sleep(backoffDelay(this.options.retryDelay, attempt))
      } finally {
        this.inflight.delete(index)
      }
    }
  }

  private async mergeChunks(): Promise<void> {
    this.setStatus('merging')
    const response = await completeChunkUpload(this.uploadId as string)
    this.result = response.data
    this.setStatus('success')
  }

  // ------------------------------------------------------------------ 进度与通知

  private currentLoaded(): number {
    // 秒传没有实际传输，但进度应显示为已完成
    if (this.status === 'success') return this.file.size
    if (this.direct) return Math.min(this.directLoaded, this.file.size)
    let loaded = 0
    for (const chunk of this.chunks) {
      loaded += chunk.status === 'success' ? chunk.size : chunk.loaded
    }
    return loaded
  }

  private currentSpeed(): number {
    if (this.status !== 'uploading' || this.samples.length < 2) return 0
    const first = this.samples[0]
    const last = this.samples[this.samples.length - 1]
    const seconds = (last.at - first.at) / 1000
    if (seconds <= 0) return 0
    return Math.max(0, (last.loaded - first.loaded) / seconds)
  }

  private setStatus(status: UploadStatus): void {
    this.status = status
    if (status === 'uploading') {
      this.samples = []
    }
    this.emit(true)
  }

  /** 进度事件极其密集，默认节流；force 用于状态变更等必须立刻反映的时刻 */
  private emit(force = false): void {
    const now = Date.now()
    if (this.status === 'uploading') {
      const loaded = this.currentLoaded()
      const last = this.samples[this.samples.length - 1]
      if (!last || last.loaded !== loaded) {
        this.samples.push({ at: now, loaded })
      }
      while (this.samples.length > 2 && now - this.samples[0].at > SPEED_WINDOW_MS) {
        this.samples.shift()
      }
    }
    if (!force && now - this.lastEmitAt < EMIT_INTERVAL_MS) return
    this.lastEmitAt = now
    this.notify(this)
  }

  private abortInflight(): void {
    this.hashController?.abort()
    for (const controller of this.inflight.values()) {
      controller.abort()
    }
    this.inflight.clear()
  }

  private throwIfInterrupted(): void {
    if (this.cancelRequested) throw new Error(CANCELLED)
    if (this.pauseRequested) throw new Error(PAUSED)
  }
}

function isSentinel(error: unknown, sentinel: string): boolean {
  return error instanceof Error && error.message === sentinel
}

function isAbortError(error: unknown): boolean {
  if (isHashAborted(error)) return true
  if (!error || typeof error !== 'object') return false
  const candidate = error as { code?: string; name?: string }
  return (
    candidate.code === 'ERR_CANCELED' ||
    candidate.name === 'CanceledError' ||
    candidate.name === 'AbortError'
  )
}

/** 指数退避 + 抖动，避免多片同时重试再次撞在一起 */
function backoffDelay(base: number, attempt: number): number {
  const delay = base * Math.pow(2, attempt)
  return Math.round(delay + Math.random() * base)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}
