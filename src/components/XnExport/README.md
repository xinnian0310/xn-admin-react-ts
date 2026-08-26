# XnExport

导出按钮：自带 loading 与成功 / 失败提示。可走自定义 `request`，或带鉴权下载 `url`。

## 文件

| 文件        | 说明     |
| ----------- | -------- |
| `index.tsx` | 导出按钮 |

## 传参

| 名称             | 类型                                                                     | 默认值                   | 说明                                   |
| ---------------- | ------------------------------------------------------------------------ | ------------------------ | -------------------------------------- |
| `request`        | `() => Promise<void>`                                                    | —                        | 自定义导出；传入后忽略 `url`           |
| `url`            | `string`                                                                 | `''`                     | 带鉴权下载地址，如 `/api/users/export` |
| `filename`       | `string`                                                                 | `'export.xlsx'`          | 下载文件名（`url` 模式）               |
| `params`         | `Record<string, unknown>`                                                | `{}`                     | 拼到 `url` 的查询参数                  |
| `text`           | `string`                                                                 | `'导出'`                 | 按钮文案                               |
| `type`           | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'info' \| 'default'` | `'primary'`              | 按钮色调                               |
| `plain`          | `boolean`                                                                | `true`                   | `ghost` 描边                           |
| `disabled`       | `boolean`                                                                | `false`                  | 禁用                                   |
| `children`       | `ReactNode`                                                              | —                        | 覆盖 `text`                            |
| `showMessage`    | `boolean`                                                                | `true`                   | 成功 toast；页面自己提示时关掉         |
| `successMessage` | `string`                                                                 | `'导出成功'`             | 成功文案                               |
| `confirm`        | `boolean`                                                                | `false`                  | 导出前 `XnPopconfirm`                  |
| `confirmTitle`   | `string`                                                                 | `'确定导出当前数据吗？'` | 确认文案                               |
| `onSuccess`      | `() => void`                                                             | —                        | 成功回调                               |
| `onError`        | `(message: string) => void`                                              | —                        | 失败回调（组件仍会 `showCaughtError`） |

## Ref（`XnExportHandle`）

| 名称     | 说明         |
| -------- | ------------ |
| `export` | 触发一次导出 |

`request` 与 `url` 都未配置时会抛「未配置导出请求」。

## 用法

```tsx
import XnExport from '@/components/XnExport'

<XnExport request={() => exportUsers(params)} />
<XnExport url="/api/users/export" filename="users.xlsx" params={params} />
<XnExport request={exportUsers} showMessage={false} confirm />
```
