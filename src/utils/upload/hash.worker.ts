import { computeFileHash } from './hash-core'
import type { HashWorkerRequest, HashWorkerResponse } from './types'

/**
 * 指纹计算 Worker：把整文件读取与摘要计算搬离主线程，避免大文件卡住界面。
 *
 * 这里不用 DOM 的 `self` 类型（工程 lib 是 dom，直接用会类型冲突），
 * 只声明实际用到的两个方法。
 */
interface WorkerScope {
  postMessage: (message: HashWorkerResponse) => void
  addEventListener: (
    type: 'message',
    listener: (event: MessageEvent<HashWorkerRequest>) => void,
  ) => void
}

const ctx = self as unknown as WorkerScope

/** 大文件分片数可达上万，进度消息需要节流，否则光发消息就占掉不少时间 */
const PROGRESS_INTERVAL = 120

ctx.addEventListener('message', (event) => {
  const { file, chunkSize, mode } = event.data
  let lastPostAt = 0

  computeFileHash({
    file,
    chunkSize,
    mode,
    onProgress: (loaded, total) => {
      const now = Date.now()
      if (loaded < total && now - lastPostAt < PROGRESS_INTERVAL) return
      lastPostAt = now
      ctx.postMessage({ type: 'progress', loaded, total })
    },
  })
    .then((result) => {
      ctx.postMessage({
        type: 'done',
        fileHash: result.fileHash,
        chunkHashes: result.chunkHashes,
      })
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : '指纹计算失败'
      ctx.postMessage({ type: 'error', message })
    })
})
