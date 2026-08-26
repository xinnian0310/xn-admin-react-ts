# XnPopconfirm

行内确认气泡。删除、撤回等轻操作优先用它，避免整页 `Modal.confirm`。

批量删除、清空、不可恢复的危险操作仍用 Modal。

## 文件

| 文件        | 说明     |
| ----------- | -------- |
| `index.tsx` | 确认气泡 |

## 传参

| 名称            | 类型                               | 默认值                 | 说明                            |
| --------------- | ---------------------------------- | ---------------------- | ------------------------------- |
| `title`         | `ReactNode`                        | `'确定执行该操作吗？'` | 气泡标题                        |
| `confirmText`   | `string`                           | `'确定'`               | 确定文案                        |
| `cancelText`    | `string`                           | `'取消'`               | 取消文案                        |
| `disabled`      | `boolean`                          | `false`                | 禁用（不触发确认）              |
| `children`      | `ReactNode`                        | —                      | 触发元素                        |
| `onConfirm`     | `() => void`                       | —                      | 点确定                          |
| `onCancel`      | `() => void`                       | —                      | 点取消                          |
| `okButtonProps` | `PopconfirmProps['okButtonProps']` | —                      | 确定按钮额外属性；默认 `danger` |

`XnTableActions` 的 `delete` 行操作已默认包一层本组件。

## 用法

```tsx
import XnPopconfirm from '@/components/XnPopconfirm'

;<XnPopconfirm title="确定删除「张三」吗？" onConfirm={() => remove(row)}>
  <Button type="link" danger>
    删除
  </Button>
</XnPopconfirm>
```
