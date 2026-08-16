# XnAuth

按钮 / 区块级权限。无对应权限时不渲染 `children`（可改用 `fallback`）。对应 Vue 端 `v-permission`。

## 文件

| 文件        | 说明     |
| ----------- | -------- |
| `index.tsx` | 权限包裹 |

## 介绍

内部调用 `usePermission()`。未传 `permission` 时原样渲染子节点。字符串走 `hasPermission`，数组走 `hasAnyPermission`（满足其一即可）。

## 使用

```tsx
import XnAuth from '@/components/XnAuth'

<XnAuth permission="user:create">
  <Button type="primary">新增</Button>
</XnAuth>

<XnAuth permission={['user:update', 'user:delete']} fallback={<span>无权限</span>}>
  <Button>编辑或删除</Button>
</XnAuth>
```

命令式判断用 hook，不必包一层：

```tsx
const { hasPermission } = usePermission()
if (!hasPermission('user:export')) return null
```

## 传参

| 名称         | 类型                 | 默认值 | 说明                   |
| ------------ | -------------------- | ------ | ---------------------- |
| `permission` | `string \| string[]` | —      | 权限码；不传则始终展示 |
| `fallback`   | `ReactNode`          | `null` | 无权限时渲染的内容     |
| `children`   | `ReactNode`          | —      | 有权限时渲染           |

## 说明

- 无回调。权限码来自后端 `/api/auth/me` 与权限内容登记。
- 工具栏按钮更常见的是把 `permission` 写在 page-ui 的 `ButtonListItem` 上，由 `XnButton` 自己过滤。
