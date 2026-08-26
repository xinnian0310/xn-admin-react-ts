# XnFilePicker

从已上传文件目录里挑选。默认请求 `browseFiles`；传入 `data` 时不打接口。

`value` 为文件 URL 或 path；`onChange` 第二个参数是完整 `FileInfo[]`。

## 文件

| 文件                | 说明     |
| ------------------- | -------- |
| `index.tsx`         | 文件选择 |
| `xnFilePicker.scss` | 样式     |

## 传参

| 名称          | 类型                                                      | 默认值         | 说明                   |
| ------------- | --------------------------------------------------------- | -------------- | ---------------------- |
| `value`       | `string \| string[]`                                      | `''`           | 已选路径 / URL         |
| `onChange`    | `(value: string \| string[], files?: FileInfo[]) => void` | —              | 确定或双击后回写       |
| `data`        | `FileInfo[]`                                              | —              | 本地列表，传入后不请求 |
| `multiple`    | `boolean`                                                 | `false`        | 多选                   |
| `disabled`    | `boolean`                                                 | `false`        | 禁用                   |
| `allowClear`  | `boolean`                                                 | `true`         | 显示「清除」           |
| `placeholder` | `string`                                                  | `'请选择文件'` | 占位                   |

## 行为说明

- 「选择」打开 `XnDialog`：面包屑进目录、当前目录搜索、单击勾选、双击文件直接确认并关窗。
- 回写优先 `url`，没有则用 `path`。目录不可选。

## 用法

```tsx
import XnFilePicker from '@/components/XnFilePicker'

<XnFilePicker value={cover} onChange={setCover} />
<XnFilePicker value={files} onChange={setFiles} multiple />
```
