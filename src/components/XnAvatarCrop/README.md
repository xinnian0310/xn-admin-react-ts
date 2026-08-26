# XnAvatarCrop

头像裁剪：选图后在画布上滚轮缩放、拖拽定位，输出正方形 PNG。传入 `request` 则上传后回写 URL，否则用本地 blob。

## 文件

| 文件                | 说明     |
| ------------------- | -------- |
| `index.tsx`         | 头像裁剪 |
| `xnAvatarCrop.scss` | 样式     |

## 传参

| 名称       | 类型                              | 默认值  | 说明                                        |
| ---------- | --------------------------------- | ------- | ------------------------------------------- |
| `value`    | `string`                          | `''`    | 当前头像 URL                                |
| `onChange` | `(value: string) => void`         | —       | 确定裁剪或点击清除后回写                    |
| `size`     | `number`                          | `88`    | 预览 Avatar 尺寸                            |
| `fallback` | `string`                          | `头像`  | 无图时的 Avatar 占位文案                    |
| `disabled` | `boolean`                         | `false` | 禁用选择与清除                              |
| `request`  | `(file: File) => Promise<string>` | —       | 自定义上传，须返回可访问 URL；不传则用 blob |

## 行为说明

- 仅接受 `png` / `jpeg` / `jpg` / `webp`。
- 裁剪画布固定 360×360，确定后导出 `avatar.png`。
- 弹窗用 `XnDialog`。

## 用法

```tsx
import XnAvatarCrop from '@/components/XnAvatarCrop'

;<XnAvatarCrop value={avatar} onChange={setAvatar} request={uploadAvatarFile} />
```
