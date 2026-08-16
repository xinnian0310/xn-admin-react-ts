# XnUpload

大文件上传组件：算指纹 → 秒传/续传探测 → 并发传分片（失败指数退避重试）→ 服务端合并。小于阈值的文件自动走单请求直传，调用方无需区分。

## 文件

| 文件            | 说明     |
| --------------- | -------- |
| `index.tsx`     | 上传组件 |
| `xnUpload.scss` | 样式     |

逻辑主体在 `@/utils/upload`（与框架无关，可单独复用）：

| 文件                | 说明                                           |
| ------------------- | ---------------------------------------------- |
| `upload-manager.ts` | 多文件队列与文件级并发                         |
| `upload-task.ts`    | 单文件状态机：指纹、探测、分片队列、重试、合并 |
| `hash.worker.ts`    | Web Worker 里算指纹，避免大文件卡住主线程      |
| `hash-core.ts`      | 分块读取 + 增量摘要，10GB 文件也不会把内存打满 |
| `sha256.ts`         | 增量 SHA-256，用于全量摘要与非安全上下文兜底   |
| `format.ts`         | 体积/速度/剩余时间格式化与文件校验             |

## Props

| 名称              | 类型                        | 默认值          | 说明                                    |
| ----------------- | --------------------------- | --------------- | --------------------------------------- |
| `chunkSize`       | `number`                    | `8 * 1024²`     | 分片大小，MinIO 要求除末片外 ≥ 5MiB     |
| `concurrency`     | `number`                    | `3`             | 单文件内同时上传的分片数                |
| `fileConcurrency` | `number`                    | `3`             | 同时上传的文件数                        |
| `maxRetries`      | `number`                    | `3`             | 单片自动重试次数（不含首次）            |
| `retryDelay`      | `number`                    | `1000`          | 首次重试等待毫秒数，后续指数退避 + 抖动 |
| `chunkTimeout`    | `number`                    | `300000`        | 单片请求超时毫秒数，`0` 不限制          |
| `sliceThreshold`  | `number`                    | `50 * 1024²`    | 小于此值直传                            |
| `enableSlice`     | `boolean`                   | `true`          | 关闭后一律直传                          |
| `enableResume`    | `boolean`                   | `true`          | 断点续传，跳过服务端已有分片            |
| `enableInstant`   | `boolean`                   | `true`          | 秒传探测                                |
| `enableHash`      | `boolean`                   | `true`          | 关闭后不读内容算指纹，秒传随之失效      |
| `hashAlgo`        | `'sha256-tree' \| 'sha256'` | `'sha256-tree'` | 见下方「指纹算法」                      |
| `verifyChunkHash` | `boolean`                   | `true`          | 随分片提交摘要，由服务端校验完整性      |
| `maxSize`         | `number`                    | `10 * 1024³`    | 单文件大小上限，`0` 不限                |
| `minSize`         | `number`                    | `0`             | 单文件大小下限                          |
| `accept`          | `string[]`                  | `[]`            | 支持 `.mp4` / `video/mp4` / `video/*`   |
| `limit`           | `number`                    | `0`             | 文件数量上限，`0` 不限                  |
| `multiple`        | `boolean`                   | `true`          | 允许多选                                |
| `autoUpload`      | `boolean`                   | `true`          | 选择后立即开始                          |
| `drag`            | `boolean`                   | `true`          | 展示拖拽区，`false` 时只给一个选择按钮  |
| `showFileList`    | `boolean`                   | `true`          | 展示文件列表与分片进度                  |
| `disabled`        | `boolean`                   | `false`         | 禁用                                    |

## 回调

| 名称         | 签名                                          | 说明                      |
| ------------ | --------------------------------------------- | ------------------------- |
| `onChange`   | `(tasks: UploadTaskSnapshot[]) => void`       | 队列快照，任一变化都触发  |
| `onProgress` | `(task: UploadTaskSnapshot) => void`          | 上传中触发                |
| `onSuccess`  | `(file: FileInfo, task: UploadTaskSnapshot)`  | 单文件完成                |
| `onError`    | `(message: string, task: UploadTaskSnapshot)` | 单文件失败（已耗尽重试）  |
| `onExceed`   | `(files: File[]) => void`                     | 超出 `limit` 被丢弃的文件 |
| `onInvalid`  | `(message: string, file: File) => void`       | 未通过大小/类型校验       |

组件自带工具栏（全部开始 / 全部暂停 / 清除已完成）与单项操作（暂停 / 继续 / 重试 / 取消 / 移除）。

## Ref

`ref` 拿到 `XnUploadHandle`：

| 名称              | 说明                             |
| ----------------- | -------------------------------- |
| `openPicker()`    | 打开系统文件选择框               |
| `addFiles(files)` | 以代码方式入队（同样走校验）     |
| `startAll()`      | 开始/继续全部                    |
| `pauseAll()`      | 暂停全部，已传成功的分片不会重传 |
| `clearSettled()`  | 移除已完成与已取消项             |
| `clear()`         | 取消并清空整个队列               |
| `tasks()`         | 当前队列快照                     |

完全脱离界面控制时也可以直接用 `UploadManager`，见下方用法。

## 状态

`pending` → `hashing` → `checking` → `uploading` → `merging` → `success`，另有 `paused` / `error` / `cancelled`。

`hashing` 与 `checking` 发生在真正传字节之前，大文件这两步耗时可观，故单独成状态；`hashing` 阶段进度条展示指纹进度，否则界面看着像卡住。

## 指纹算法

| 算法          | 说明                                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `sha256-tree` | 每片算原生 SHA-256，再对所有分片摘要拼接算一次。全程走原生实现，快；但取值依赖 `chunkSize`，秒传只在同分片大小间生效 |
| `sha256`      | 整文件真实 SHA-256，与 `sha256sum` 一致，跨 `chunkSize` 可秒传；纯 JS 增量实现，明显更慢                             |
| `meta`        | `enableHash: false` 时自动使用，由文件名/大小/修改时间派生，不读内容。仅可用于续传，服务端不会据此秒传               |

## 依赖

- `@/api/chunk-upload`：`check` / `init` / `status` / `part` / `complete` / `cancel`
- `@/api/file-job` 的 `uploadFile`：直传通道
- 后端 `/api/files/chunk/**`，需具备 `file:upload` 权限

## 用法

```tsx
import XnUpload from '@/components/XnUpload'

;<XnUpload
  chunkSize={8 * 1024 * 1024}
  concurrency={3}
  maxRetries={3}
  maxSize={10 * 1024 * 1024 * 1024}
  accept={['video/*']}
  onSuccess={(file) => console.log(file.url)}
  onError={(text) => console.error(text)}
/>
```

表单里的多附件字段（公告管理 / 站内信即此用法）：成功后把 `{ name, path }` 推进列表并把队列清空，避免和已保存附件重复展示。

```tsx
<XnUpload
  ref={uploaderRef}
  limit={remainingSlots}
  onSuccess={(file) => {
    form.setFieldsValue({
      attachments: [...attachments, { name: file.name, path: file.path }],
    })
    uploaderRef.current?.clearSettled()
  }}
/>
```

不需要界面时也可以直接用核心库：

```ts
import { UploadManager, DEFAULT_UPLOADER_OPTIONS } from '@/utils/upload'

const manager = new UploadManager({ ...DEFAULT_UPLOADER_OPTIONS, concurrency: 5 })
manager.subscribe((tasks) => console.log(tasks))
manager.add([file])
```

## 说明

- 分片请求带 `silentError`，自动重试期间不弹错误提示，避免刷屏；`401` 强制下线仍正常触发。
- 分片数可达上万，界面会把分片聚合成最多 100 个区块展示。
- 拖入文件夹会逐层展开其中的所有文件。
- `crypto.subtle` 仅在安全上下文（https / localhost）可用，用 http 访问内网地址时自动退回纯 JS 摘要实现。
