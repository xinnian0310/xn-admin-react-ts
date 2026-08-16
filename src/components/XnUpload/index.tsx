import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Button, Progress, Tag, message } from 'antd'
import {
  CloseCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  InboxOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { openKkFileViewPreview } from '@/utils/kk-file-view'
import type { FileInfo } from '@/types'
import { UploadManager } from '@/utils/upload/upload-manager'
import { DEFAULT_MAX_FILE_SIZE, DEFAULT_UPLOADER_OPTIONS } from '@/utils/upload/types'
import type { UploadStatus, UploadTaskSnapshot, UploaderOptions } from '@/utils/upload/types'
import { formatBytes, formatDuration, formatSpeed, validateFile } from '@/utils/upload/format'
import { formatDateTime } from '@/utils/datetime'
import './xnUpload.scss'

/** 命令式接口，供表单等场景在成功后清队列、或以代码方式入队 */
export interface XnUploadHandle {
  openPicker: () => void
  /** 以代码方式加入文件（同样走大小 / 类型校验） */
  addFiles: (files: File[]) => void
  startAll: () => void
  pauseAll: () => void
  /** 移除已完成与已取消项 */
  clearSettled: () => void
  /** 取消并清空整个队列 */
  clear: () => Promise<void>
  /** 当前队列快照 */
  tasks: () => UploadTaskSnapshot[]
}

export interface XnUploadProps {
  ref?: React.Ref<XnUploadHandle>
  /** 分片大小；MinIO 原生分片要求除末片外 ≥ 5MiB */
  chunkSize?: number
  /** 单文件内同时上传的分片数 */
  concurrency?: number
  /** 同时上传的文件数 */
  fileConcurrency?: number
  maxRetries?: number
  retryDelay?: number
  /** 单片请求超时毫秒数；0 表示不限制 */
  chunkTimeout?: number
  /** 小于此值直接单请求上传 */
  sliceThreshold?: number
  enableSlice?: boolean
  enableResume?: boolean
  enableInstant?: boolean
  /** 关闭后不读文件内容算指纹，秒传随之失效 */
  enableHash?: boolean
  hashAlgo?: 'sha256-tree' | 'sha256'
  verifyChunkHash?: boolean
  /** 单文件大小上限；0 表示不限 */
  maxSize?: number
  minSize?: number
  /** 允许类型，支持 `.mp4` / `video/mp4` / `video/*` */
  accept?: string[]
  /** 文件数量上限；0 表示不限 */
  limit?: number
  multiple?: boolean
  /** 选择后立即开始上传 */
  autoUpload?: boolean
  /** 展示拖拽区；false 时只给一个选择按钮 */
  drag?: boolean
  showFileList?: boolean
  disabled?: boolean
  onChange?: (tasks: UploadTaskSnapshot[]) => void
  onProgress?: (task: UploadTaskSnapshot) => void
  onSuccess?: (file: FileInfo, task: UploadTaskSnapshot) => void
  onError?: (message: string, task: UploadTaskSnapshot) => void
  /** 超出数量上限时抛出被丢弃的文件 */
  onExceed?: (files: File[]) => void
  /** 未通过大小 / 类型校验 */
  onInvalid?: (message: string, file: File) => void
}

type TagColor = 'default' | 'processing' | 'success' | 'warning' | 'error'

const STATUS_META: Record<UploadStatus, { text: string; color: TagColor }> = {
  pending: { text: '等待中', color: 'default' },
  hashing: { text: '计算指纹', color: 'warning' },
  checking: { text: '秒传探测', color: 'warning' },
  uploading: { text: '上传中', color: 'processing' },
  paused: { text: '已暂停', color: 'default' },
  merging: { text: '合并中', color: 'warning' },
  success: { text: '已完成', color: 'success' },
  error: { text: '失败', color: 'error' },
  cancelled: { text: '已取消', color: 'default' },
}

/** 分片数可达上万，超过这个数量就聚合成区块展示，避免渲染上万个节点 */
const MAX_CHUNK_BLOCKS = 100

function isSettled(task: UploadTaskSnapshot) {
  return task.status === 'success' || task.status === 'cancelled'
}

function canPause(task: UploadTaskSnapshot) {
  return task.status === 'uploading' || task.status === 'hashing' || task.status === 'checking'
}

/** 指纹阶段没有上传字节，进度条改为展示指纹进度，否则界面看着像卡住 */
function progressOf(task: UploadTaskSnapshot) {
  return task.status === 'hashing' ? task.hashPercent : task.percent
}

function progressStatus(task: UploadTaskSnapshot) {
  if (task.status === 'success') return 'success' as const
  if (task.status === 'error' || task.status === 'cancelled') return 'exception' as const
  if (task.status === 'uploading') return 'active' as const
  return 'normal' as const
}

function metaText(task: UploadTaskSnapshot) {
  switch (task.status) {
    case 'hashing':
      return `计算文件指纹 ${task.hashPercent.toFixed(1)}%`
    case 'checking':
      return '正在探测秒传 / 断点续传'
    case 'merging':
      return '服务端合并分片中'
    case 'success':
      return task.instant ? '服务端已存在同内容文件，未重复传输' : '上传完成'
    case 'uploading':
      return `${formatSpeed(task.speed)} · 剩余 ${formatDuration(task.remainingTime)}`
    case 'paused':
      return '已暂停'
    default:
      return ''
  }
}

function chunkBlocks(task: UploadTaskSnapshot) {
  const groupSize = Math.max(1, Math.ceil(task.chunks.length / MAX_CHUNK_BLOCKS))
  const blocks: { key: number; state: string }[] = []
  for (let start = 0; start < task.chunks.length; start += groupSize) {
    const group = task.chunks.slice(start, start + groupSize)
    let state = 'pending'
    if (group.every((chunk) => chunk.status === 'success')) state = 'success'
    else if (group.some((chunk) => chunk.status === 'error')) state = 'error'
    else if (group.some((chunk) => chunk.status === 'uploading')) state = 'uploading'
    blocks.push({ key: start, state })
  }
  return blocks
}

/**
 * 大文件上传：算指纹 → 秒传/续传探测 → 并发传分片（失败指数退避重试）→ 服务端合并。
 *
 * 小于阈值的文件自动走单请求直传，调用方无需区分。
 */
export default function XnUpload({
  ref,
  chunkSize = DEFAULT_UPLOADER_OPTIONS.chunkSize,
  concurrency = DEFAULT_UPLOADER_OPTIONS.concurrency,
  fileConcurrency = DEFAULT_UPLOADER_OPTIONS.fileConcurrency,
  maxRetries = DEFAULT_UPLOADER_OPTIONS.maxRetries,
  retryDelay = DEFAULT_UPLOADER_OPTIONS.retryDelay,
  chunkTimeout = DEFAULT_UPLOADER_OPTIONS.chunkTimeout,
  sliceThreshold = DEFAULT_UPLOADER_OPTIONS.sliceThreshold,
  enableSlice = true,
  enableResume = true,
  enableInstant = true,
  enableHash = true,
  hashAlgo = 'sha256-tree',
  verifyChunkHash = true,
  maxSize = DEFAULT_MAX_FILE_SIZE,
  minSize = 0,
  accept = [],
  limit = 0,
  multiple = true,
  autoUpload = true,
  drag = true,
  showFileList = true,
  disabled = false,
  onChange,
  onProgress,
  onSuccess,
  onError,
  onExceed,
  onInvalid,
}: XnUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [tasks, setTasks] = useState<UploadTaskSnapshot[]>([])
  const [dragOver, setDragOver] = useState(false)

  // 回调放进 ref，订阅只需建立一次，父组件每次渲染换新的箭头函数也不会反复重订阅
  const handlers = useRef({ onChange, onProgress, onSuccess, onError, onExceed, onInvalid })
  handlers.current = { onChange, onProgress, onSuccess, onError, onExceed, onInvalid }

  const options: UploaderOptions = useMemo(
    () => ({
      chunkSize,
      concurrency,
      fileConcurrency,
      maxRetries,
      retryDelay,
      chunkTimeout,
      sliceThreshold,
      enableSlice,
      enableResume,
      enableInstant,
      enableHash,
      hashAlgo,
      verifyChunkHash,
    }),
    [
      chunkSize,
      concurrency,
      fileConcurrency,
      maxRetries,
      retryDelay,
      chunkTimeout,
      sliceThreshold,
      enableSlice,
      enableResume,
      enableInstant,
      enableHash,
      hashAlgo,
      verifyChunkHash,
    ],
  )

  // manager 必须跨渲染保持同一实例，否则进行中的上传会在每次渲染时丢失
  const managerRef = useRef<UploadManager>(null)
  if (!managerRef.current) {
    managerRef.current = new UploadManager(options)
  }
  const manager = managerRef.current

  useEffect(() => {
    manager.setOptions(options)
  }, [manager, options])

  useEffect(() => {
    const lastStatus = new Map<string, UploadStatus>()
    const unsubscribe = manager.subscribe((snapshot) => {
      setTasks(snapshot)
      const cb = handlers.current
      for (const id of [...lastStatus.keys()]) {
        if (!snapshot.some((task) => task.id === id)) lastStatus.delete(id)
      }
      for (const task of snapshot) {
        if (task.status === 'uploading') {
          cb.onProgress?.(task)
        }
        if (lastStatus.get(task.id) === task.status) continue
        lastStatus.set(task.id, task.status)
        if (task.status === 'success' && task.result) {
          cb.onSuccess?.(task.result, task)
        } else if (task.status === 'error') {
          cb.onError?.(task.error ?? '上传失败', task)
        }
      }
      cb.onChange?.(snapshot)
    })
    return () => {
      unsubscribe()
      manager.dispose()
    }
  }, [manager])

  const addFiles = useCallback(
    (files: File[]) => {
      if (disabled || files.length === 0) return
      const cb = handlers.current
      const accepted: File[] = []
      for (const file of files) {
        const invalid = validateFile(file, { maxSize, minSize, accept })
        if (invalid) {
          message.warning(invalid)
          cb.onInvalid?.(invalid, file)
          continue
        }
        accepted.push(file)
      }
      if (accepted.length === 0) return

      let queued = accepted
      if (limit > 0) {
        const room = Math.max(0, limit - manager.snapshot().length)
        if (accepted.length > room) {
          const dropped = accepted.slice(room)
          queued = accepted.slice(0, room)
          message.warning(`最多上传 ${limit} 个文件，已忽略 ${dropped.length} 个`)
          cb.onExceed?.(dropped)
        }
      }
      if (queued.length === 0) return
      manager.add(queued, autoUpload)
    },
    [accept, autoUpload, disabled, limit, manager, maxSize, minSize],
  )

  const openPicker = useCallback(() => {
    if (disabled) return
    inputRef.current?.click()
  }, [disabled])

  useImperativeHandle(
    ref,
    () => ({
      openPicker,
      addFiles,
      startAll: () => {
        manager.resumeAll()
        manager.start()
      },
      pauseAll: () => manager.pauseAll(),
      clearSettled: () => manager.clearSettled(),
      clear: async () => {
        await manager.cancelAll()
        manager.clearSettled()
      },
      tasks: () => manager.snapshot(),
    }),
    [addFiles, manager, openPicker],
  )

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setDragOver(false)
      if (disabled || !event.dataTransfer) return
      addFiles(await collectDroppedFiles(event.dataTransfer))
    },
    [addFiles, disabled],
  )

  const acceptAttr = accept.length ? accept.join(',') : undefined

  const hintText = useMemo(() => {
    const parts: string[] = []
    parts.push(accept.length ? `支持 ${accept.join('、')}` : '支持任意类型')
    if (maxSize > 0) parts.push(`单文件 ≤ ${formatBytes(maxSize)}`)
    return parts.join(' · ')
  }, [accept, maxSize])

  const totalSize = tasks.reduce((sum, task) => sum + task.size, 0)
  const successCount = tasks.filter((task) => task.status === 'success').length
  const hasStartable = tasks.some((task) => task.status === 'pending' || task.status === 'paused')
  const hasPausable = tasks.some((task) => canPause(task))
  const hasSettled = tasks.some((task) => isSettled(task))

  return (
    <div className={`xn-upload${disabled ? ' is-disabled' : ''}`}>
      {drag ? (
        <div
          className={`xn-upload__drop${dragOver ? ' is-over' : ''}`}
          role="button"
          tabIndex={0}
          onClick={openPicker}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openPicker()
            }
          }}
          onDragOver={(event) => {
            event.preventDefault()
            if (!disabled) setDragOver(true)
          }}
          onDragLeave={(event) => {
            event.preventDefault()
            setDragOver(false)
          }}
          onDrop={onDrop}
        >
          <InboxOutlined className="xn-upload__drop-icon" />
          <div className="xn-upload__drop-text">
            将文件拖到此处，或 <em>点击选择文件</em>
          </div>
          <div className="xn-upload__drop-hint">{hintText}</div>
        </div>
      ) : (
        <Button type="primary" icon={<InboxOutlined />} disabled={disabled} onClick={openPicker}>
          选择文件
        </Button>
      )}

      <input
        ref={inputRef}
        className="xn-upload__input"
        type="file"
        hidden
        tabIndex={-1}
        aria-hidden
        multiple={multiple}
        accept={acceptAttr}
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []))
          // 清空后同一个文件可再次触发 change，续传场景需要重新选同一文件
          event.target.value = ''
        }}
      />

      {showFileList && tasks.length > 0 && (
        <>
          <div className="xn-upload__toolbar">
            <div className="xn-upload__summary">
              共 {tasks.length} 个文件 · {formatBytes(totalSize)} · 已完成 {successCount}/
              {tasks.length}
            </div>
            <div>
              <Button
                size="small"
                disabled={!hasStartable}
                onClick={() => {
                  manager.resumeAll()
                  manager.start()
                }}
              >
                全部开始
              </Button>{' '}
              <Button size="small" disabled={!hasPausable} onClick={() => manager.pauseAll()}>
                全部暂停
              </Button>{' '}
              <Button size="small" disabled={!hasSettled} onClick={() => manager.clearSettled()}>
                清除已完成
              </Button>
            </div>
          </div>

          <ul className="xn-upload__list">
            {tasks.map((task) => (
              <li key={task.id} className="xn-upload__item">
                <div className="xn-upload__item-head">
                  <div className="xn-upload__item-title">
                    <span className="xn-upload__item-name" title={task.name}>
                      {task.name}
                    </span>
                    {task.instant && <span className="xn-upload__badge">秒传</span>}
                    {!task.instant && task.direct && <span className="xn-upload__badge">直传</span>}
                    {!task.instant && !task.direct && task.totalChunks > 0 && (
                      <span className="xn-upload__badge">
                        分片 {task.uploadedChunks}/{task.totalChunks}
                      </span>
                    )}
                  </div>
                  <Tag color={STATUS_META[task.status].color}>{STATUS_META[task.status].text}</Tag>
                  <span className="xn-upload__item-size">{formatBytes(task.size)}</span>
                  {task.status === 'success' ? (
                    <span className="xn-upload__item-time">
                      {formatDateTime(task.result?.lastModified)}
                    </span>
                  ) : null}
                  <span className="xn-upload__item-actions">
                    {canPause(task) && (
                      <Button
                        size="small"
                        type="text"
                        icon={<PauseCircleOutlined />}
                        onClick={() => manager.find(task.id)?.pause()}
                      >
                        暂停
                      </Button>
                    )}
                    {task.status === 'paused' && (
                      <Button
                        size="small"
                        type="text"
                        icon={<PlayCircleOutlined />}
                        onClick={() => manager.find(task.id)?.resume()}
                      >
                        继续
                      </Button>
                    )}
                    {task.status === 'error' && (
                      <Button
                        size="small"
                        type="text"
                        icon={<ReloadOutlined />}
                        onClick={() => manager.find(task.id)?.retry()}
                      >
                        重试
                      </Button>
                    )}
                    {!isSettled(task) && (
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => void manager.find(task.id)?.cancel()}
                      >
                        取消
                      </Button>
                    )}
                    {task.status === 'success' && task.result?.path ? (
                      <Button
                        size="small"
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() =>
                          openKkFileViewPreview(task.result!.path, task.result!.name || task.name)
                        }
                      >
                        查看
                      </Button>
                    ) : null}
                    <Button
                      size="small"
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => void manager.remove(task.id)}
                    >
                      移除
                    </Button>
                  </span>
                </div>

                <Progress
                  percent={progressOf(task)}
                  status={progressStatus(task)}
                  showInfo={false}
                  strokeWidth={4}
                />

                {metaText(task) ? (
                  <div className="xn-upload__item-meta">
                    <span>{metaText(task)}</span>
                  </div>
                ) : null}

                {task.chunks.length > 1 && (
                  <div className="xn-upload__chunks">
                    {chunkBlocks(task).map((block) => (
                      <span key={block.key} className={`xn-upload__chunk is-${block.state}`} />
                    ))}
                  </div>
                )}

                {task.error && <div className="xn-upload__item-error">{task.error}</div>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

/** 支持拖入文件夹：逐层展开目录内的所有文件 */
async function collectDroppedFiles(transfer: DataTransfer): Promise<File[]> {
  const entries: FileSystemEntry[] = []
  for (const item of Array.from(transfer.items)) {
    const entry = item.webkitGetAsEntry?.()
    if (entry) entries.push(entry)
  }
  if (entries.length === 0) return Array.from(transfer.files)

  const files: File[] = []
  const walk = async (entry: FileSystemEntry): Promise<void> => {
    if (entry.isFile) {
      files.push(await readEntryFile(entry as FileSystemFileEntry))
      return
    }
    for (const child of await readDirectory(entry as FileSystemDirectoryEntry)) {
      await walk(child)
    }
  }
  for (const entry of entries) {
    await walk(entry)
  }
  return files
}

function readEntryFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject))
}

/** readEntries 每次最多返回一批，须反复读到空数组为止 */
function readDirectory(entry: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
  const reader = entry.createReader()
  const all: FileSystemEntry[] = []
  return new Promise((resolve, reject) => {
    const readBatch = () => {
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(all)
          return
        }
        all.push(...batch)
        readBatch()
      }, reject)
    }
    readBatch()
  })
}
