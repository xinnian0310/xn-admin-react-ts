# XnCopy

一键复制按钮：图标 + 可选原文，成功后短暂显示「已复制」。

## 文件

| 文件          | 说明     |
| ------------- | -------- |
| `index.tsx`   | 复制按钮 |
| `xnCopy.scss` | 样式     |

## 传参

| 名称          | 类型                             | 默认值    | 说明                       |
| ------------- | -------------------------------- | --------- | -------------------------- |
| `text`        | `string \| number \| null`       | `''`      | 要复制的内容；空则按钮禁用 |
| `label`       | `string`                         | `''`      | 按钮文案；空则只显示图标   |
| `copiedLabel` | `string`                         | `已复制`  | 成功后的短暂文案           |
| `showText`    | `boolean`                        | `false`   | 是否在按钮前展示原文       |
| `type`        | `'link' \| 'default'`            | `'link'`  | 按钮类型                   |
| `size`        | `'large' \| 'middle' \| 'small'` | `'small'` | 按钮尺寸                   |
| `disabled`    | `boolean`                        | `false`   | 禁用                       |
| `silent`      | `boolean`                        | `false`   | 为真时不弹 toast           |
| `block`       | `boolean`                        | `false`   | 块级布局                   |
| `onCopied`    | `(text: string) => void`         | —         | 复制成功                   |
| `onError`     | `() => void`                     | —         | 复制失败                   |

## 用法

```tsx
import XnCopy from '@/components/XnCopy'

<XnCopy text={secret} />
<XnCopy text={row.id} showText label="复制" />
```
