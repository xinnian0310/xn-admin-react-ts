# XnImport

Excel 导入对话框：下载模板 → 上传解析预览 → 调用 `importer` 提交。用户 / 岗位等列表的「导入」即此组件。

## 文件

| 文件        | 说明     |
| ----------- | -------- |
| `index.tsx` | 导入对话框 |

## 介绍

`columns` 同时驱动模板表头与解析映射。`importer` 由页面传入（通常打后端 `/import`）。全部成功自动关窗；部分失败停留并展示错误表。用 `ref.open()` 打开，不要自己绑 `open`。

弹窗使用 `XnModal`。

## 使用

```tsx
import XnImport, { type XnImportHandle } from '@/components/XnImport'

const importRef = useRef<XnImportHandle>(null)

<XnImport
  ref={importRef}
  title="导入用户"
  columns={importColumns}
  templateName="用户导入模板"
  importer={doImport}
  onSuccess={() => load()}
/>

<Button onClick={() => importRef.current?.open()}>导入</Button>
```

```ts
async function doImport(rows: Record<string, string>[]) {
  return request.post('/users/import', { rows })
}
```

## 传参

| 名称           | 类型                  | 默认值         | 必填 | 说明       |
| -------------- | --------------------- | -------------- | ---- | ---------- |
| `title`        | `string`              | `'Excel 导入'` | 否   | 标题       |
| `columns`      | `ExcelImportColumn[]` | —              | 是   | 列定义     |
| `templateName` | `string`              | `'导入模板'`   | 否   | 模板文件名 |
| `importer`     | `ExcelImportSubmit`   | —              | 是   | 提交函数   |
| `maxRows`      | `number`              | `2000`         | 否   | 最大行数   |
| `previewLimit` | `number`              | `50`           | 否   | 预览行数   |
| `onSuccess`    | `(result?) => void`   | —              | 否   | 成功回调   |

## Ref（`XnImportHandle`）

| 名称   | 说明                 |
| ------ | -------------------- |
| `open` | 重置状态并打开对话框 |

## 依赖

- `@/types/excel`
- `@/utils/excel`
- `XnModal`
