# XnButton

工具栏按钮组与表格行操作按钮。支持 page-ui 配置、权限过滤、按选中行数启用/禁用。

## 文件

| 文件            | 说明                          |
| --------------- | ----------------------------- |
| `index.tsx`     | `XnButton` + `XnTableActions` |
| `xnButton.scss` | 主色 / 链接色                 |

## 介绍

`XnButton` 放在 `XnPageLayout` 的 `toolbar`；`XnTableActions` 放在表格操作列。按钮列表通常来自 `usePageUi(routePath).buttonItems`。无权限的按钮不渲染。`index` 表示「需要选中的行数 - 1」（编辑/查看一般为 `0`，即恰好 1 行）。

与 Vue 差异：没有 `createPermission` 等独立权限 props，权限写在每条 `ButtonListItem.permission` 上。

## 使用

```tsx
import XnButton, { XnTableActions } from '@/components/XnButton'

<XnButton
  listItem={buttonItems}
  selected={selected}
  onButtonClick={(action) => {
    if (action === 'add') openSave('add')
  }}
/>

<XnTableActions
  items={tableButtonItems}
  row={row}
  disabled={(action, row) => row.builtIn && action === 'delete'}
  onActionClick={({ action, row }) => onRowAction(action, row)}
/>
```

## 传参（XnButton）

| 名称            | 类型                                             | 默认值 | 说明             |
| --------------- | ------------------------------------------------ | ------ | ---------------- |
| `listItem`      | `ButtonListItem[]`                               | `[]`   | 传 `[]` 则不渲染 |
| `selected`      | `unknown[]`                                      | `[]`   | 当前表格选中行   |
| `onButtonClick` | `(action: string, item: ButtonListItem) => void` | —      | 点击回调         |

## 传参（XnTableActions）

| 名称            | 类型                                                          | 默认值 | 说明                     |
| --------------- | ------------------------------------------------------------- | ------ | ------------------------ |
| `items`         | `ButtonListItem[]`                                            | `[]`   | 行操作配置               |
| `row`           | `Record<string, unknown>`                                     | —      | 当前行                   |
| `disabled`      | `(action, row) => boolean \| string`                          | —      | 返回 `true`/字符串则禁用 |
| `onActionClick` | `(payload: { action: string; row: Record<string, unknown> })` | —      | 行内点击                 |

## 行为说明

- `index`：需要选中 `index + 1` 行才可点
- `delete` / `publish` / `revoke`：至少选中 1 行
- 下拉：`type: 'down'` + `searchItem` 子项
- 禁用时点击会 `message.warning` 提示选中数量

## 相关类型

`ButtonListItem`（`@/types/button`）：`name`、`type`、`action`、`permission`、`index`、`typeColor`、`icon`、`searchItem` 等。
