# XnImageUpload

图片上传：卡片预览、点击放大。`limit=1` 为单张（`value` 是 URL 字符串），大于 1 为多张（URL 数组）。

与 `XnUpload`（大文件分片）分开。默认走 `/files/upload`，也可传入 `request`。

## 文件

| 文件                 | 说明     |
| -------------------- | -------- |
| `index.tsx`          | 图片上传 |
| `xnImageUpload.scss` | 样式     |

## 传参

| 名称       | 类型                                  | 默认值                                                                | 说明                         |
| ---------- | ------------------------------------- | --------------------------------------------------------------------- | ---------------------------- |
| `value`    | `string \| string[]`                  | —                                                                     | 单张为 URL，多张为 URL 数组  |
| `onChange` | `(value: string \| string[]) => void` | —                                                                     | 受控回写                     |
| `limit`    | `number`                              | `1`                                                                   | 最多张数；`1` 表示单张       |
| `disabled` | `boolean`                             | `false`                                                               | 禁用                         |
| `accept`   | `string`                              | `'image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml'` | 允许的 MIME / 扩展名         |
| `maxSize`  | `number`                              | `5 * 1024 * 1024`                                                     | 单张上限（字节），默认 5MB   |
| `tip`      | `string`                              | `''`                                                                  | 底部说明                     |
| `request`  | `(file: File) => Promise<string>`     | —                                                                     | 自定义上传，须返回可访问 URL |

## 行为说明

- 超出类型 / 大小 / 张数会 `message.warning` 并忽略该文件。
- 达 `limit` 后隐藏加号。

## 用法

```tsx
import XnImageUpload from '@/components/XnImageUpload'

<XnImageUpload value={logo} onChange={setLogo} limit={1} tip="一张图同时用于 Logo 与 favicon" />
<XnImageUpload value={gallery} onChange={setGallery} limit={6} />
<XnImageUpload value={avatar} onChange={setAvatar} request={uploadAvatarUrl} />
```
