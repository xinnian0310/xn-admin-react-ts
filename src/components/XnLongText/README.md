# XnLongText

表格/列表中的长文本展示：单行截断，点击后弹窗查看全文。

## 文件

| 文件        | 说明     |
| ----------- | -------- |
| `index.tsx` | 组件本体 |

## 介绍

空值显示 `emptyText`。长度不超过 `maxLength` 时原样展示；超出则截断并加省略号，点击用 `Modal.info` 打开全文（`<pre>` 保留换行）。`XnTable` 列 `type: 'longText'` 会自动用本组件。

与 Vue 差异：弹窗没有单独的「复制」按钮，可用系统选中复制。

## 使用

```tsx
import XnLongText from '@/components/XnLongText'

<XnLongText text={row.userAgent} title="浏览器" maxLength={48} />
```

列配置：

```ts
{ type: 'longText', prop: 'userAgent', label: '浏览器', minWidth: 200 }
```

## 传参

| 名称        | 类型     | 默认值     | 说明                 |
| ----------- | -------- | ---------- | -------------------- |
| `text`      | `string` | `''`       | 完整文本             |
| `title`     | `string` | `详细内容` | 弹窗标题             |
| `emptyText` | `string` | `—`        | 空值占位             |
| `maxLength` | `number` | `48`       | 触发区最大展示字符数 |
