import { DEFAULT_UPLOADER_OPTIONS } from './types'
import type { UploadTaskSnapshot, UploaderOptions } from './types'
import { UploadTask } from './upload-task'

/**
 * 上传队列：持有多个 {@link UploadTask}，按 `fileConcurrency` 控制同时上传的文件数。
 *
 * 与框架无关——通过 `subscribe` 把变更推给 UI 层，Vue / React 各自把 `snapshot()` 映射成自己的响应式状态。
 */
export class UploadManager {
  private options: UploaderOptions
  private tasks: UploadTask[] = []
  private readonly listeners = new Set<(tasks: UploadTaskSnapshot[]) => void>()

  constructor(options?: Partial<UploaderOptions>) {
    this.options = { ...DEFAULT_UPLOADER_OPTIONS, ...options }
  }

  /** 更新配置；已在传输中的任务沿用创建时的配置，避免分片边界中途变化 */
  setOptions(options: Partial<UploaderOptions>): void {
    this.options = { ...this.options, ...options }
  }

  getOptions(): UploaderOptions {
    return { ...this.options }
  }

  add(files: File[], autoStart = true): UploadTask[] {
    const created: UploadTask[] = []
    for (const file of files) {
      const task = new UploadTask(file, { ...this.options }, () => this.handleTaskChange())
      this.tasks.push(task)
      created.push(task)
    }
    this.emit()
    if (autoStart) this.pump()
    return created
  }

  start(id?: string): void {
    if (id) {
      const task = this.find(id)
      if (task) void task.start()
      return
    }
    this.pump()
  }

  pauseAll(): void {
    for (const task of this.tasks) {
      task.pause()
    }
    this.emit()
  }

  resumeAll(): void {
    for (const task of this.tasks) {
      task.resume()
    }
    this.pump()
  }

  async cancelAll(): Promise<void> {
    await Promise.all(this.tasks.map((task) => task.cancel()))
    this.emit()
  }

  /** 从队列中移除；未结束的任务会先取消并清理服务端分片 */
  async remove(id: string): Promise<void> {
    const task = this.find(id)
    if (!task) return
    if (!task.isSettled) {
      await task.cancel()
    }
    this.tasks = this.tasks.filter((item) => item.id !== id)
    this.emit()
    this.pump()
  }

  /** 清掉已完成 / 已取消的记录 */
  clearSettled(): void {
    this.tasks = this.tasks.filter((task) => !task.isSettled)
    this.emit()
  }

  find(id: string): UploadTask | undefined {
    return this.tasks.find((task) => task.id === id)
  }

  snapshot(): UploadTaskSnapshot[] {
    return this.tasks.map((task) => task.snapshot())
  }

  subscribe(listener: (tasks: UploadTaskSnapshot[]) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** 组件卸载时调用：中断所有进行中的请求，避免野请求继续跑 */
  dispose(): void {
    for (const task of this.tasks) {
      task.pause()
    }
    this.listeners.clear()
  }

  private handleTaskChange(): void {
    this.pump()
    this.emit()
  }

  /** 把 pending 任务补满到并发上限；paused / error 需用户显式操作，不自动重启 */
  private pump(): void {
    const limit = Math.max(1, this.options.fileConcurrency)
    let active = this.tasks.filter((task) => task.isRunning).length
    for (const task of this.tasks) {
      if (active >= limit) return
      if (task.currentStatus === 'pending' && !task.isRunning) {
        active += 1
        void task.start()
      }
    }
  }

  private emit(): void {
    const snapshot = this.snapshot()
    for (const listener of this.listeners) {
      listener(snapshot)
    }
  }
}
