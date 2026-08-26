# XnWatermark

页面水印。不传 `content` 时固定展示「心念科技」。布局层已包一层，业务页也可局部再包。内部用 Ant Design `Watermark`。

默认 `inherit={false}`，避免水印注入到 Modal / Drawer 里把弹窗外框撑乱。

## 文件

| 文件               | 说明 |
| ------------------ | ---- |
| `index.tsx`        | 水印 |
| `xnWatermark.scss` | 样式 |

## 传参

| 名称       | 类型                 | 默认值       | 说明                   |
| ---------- | -------------------- | ------------ | ---------------------- |
| `content`  | `string \| string[]` | `'心念科技'` | 水印文案；不传则用默认 |
| `disabled` | `boolean`            | `false`      | 为真时不渲染水印文案   |
| `gap`      | `[number, number]`   | `[140, 120]` | 水印间距               |
| `children` | `ReactNode`          | —            | 被水印覆盖的内容       |

字号 / 颜色写死：`14px`、`rgba(0, 0, 0, 0.08)`。

## 用法

```tsx
import XnWatermark from '@/components/XnWatermark'

;<XnWatermark content="心念科技">
  <div>页面内容</div>
</XnWatermark>
```
