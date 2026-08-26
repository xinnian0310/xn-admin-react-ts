# XnDesc

详情描述列表，包 Ant Design `Descriptions`。`type: 'pre'` 用于长文本；`type: 'copy'` 在值旁显示复制按钮。

## 文件

| 文件          | 说明     |
| ------------- | -------- |
| `index.tsx`   | 描述列表 |
| `xnDesc.scss` | 样式     |

## 传参

| 名称       | 类型                             | 默认值 | 说明       |
| ---------- | -------------------------------- | ------ | ---------- |
| `items`    | `DescItem[]`                     | `[]`   | 描述项     |
| `title`    | `ReactNode`                      | `''`   | 标题       |
| `column`   | `number`                         | `1`    | 列数       |
| `bordered` | `boolean`                        | `true` | 是否带边框 |
| `size`     | `'large' \| 'middle' \| 'small'` | —      | 尺寸       |

### `DescItem`

| 名称        | 类型                        | 默认值 | 说明                                     |
| ----------- | --------------------------- | ------ | ---------------------------------------- |
| `label`     | `string`                    | —      | 标签                                     |
| `value`     | `unknown`                   | —      | 展示值；空则显示 `emptyText`（默认 `—`） |
| `prop`      | `string`                    | —      | React key                                |
| `span`      | `number`                    | —      | 占据列数                                 |
| `type`      | `'text' \| 'pre' \| 'copy'` | 文本   | `pre` 预格式化；`copy` 旁挂 `XnCopy`     |
| `emptyText` | `string`                    | `'—'`  | 空值占位                                 |
| `children`  | `ReactNode`                 | —      | 仅默认文本模式可用，优先于 `value`       |

## 用法

```tsx
import XnDesc from '@/components/XnDesc'

;<XnDesc
  column={2}
  items={[
    { label: '操作人', value: row.operatorName },
    { label: 'IP', value: row.ip, type: 'copy' },
    { label: '参数', value: row.params, type: 'pre', span: 2 },
  ]}
/>
```
