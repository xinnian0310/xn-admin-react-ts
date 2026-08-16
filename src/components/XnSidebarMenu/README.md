# XnSidebarMenu

多级侧边 / 顶栏菜单。把后端菜单树转成 Ant Design `Menu` items。

## 文件

| 文件        | 说明     |
| ----------- | -------- |
| `index.tsx` | 菜单容器 |

## 介绍

由布局传入 `menus`（一般来自 `menuStore`，后端 `/api/auth/menus`）。图标优先 `iconAntd`，回退 `icon`，经 `XnAppIcon` 渲染。隐藏项会被过滤。竖向菜单默认带搜索框，匹配标题并展开祖先。

`mode`：`inline`（侧栏折叠）、`vertical`（双列）、`horizontal`（顶栏）。

## 使用

```tsx
import XnSidebarMenu from '@/components/XnSidebarMenu'

<XnSidebarMenu
  menus={menus}
  mode="inline"
  theme="dark"
  collapsed={collapsed}
  onSelectPath={(path) => navigate(path)}
/>
```

顶栏：

```tsx
<XnSidebarMenu menus={menus} mode="horizontal" theme="light" showSearch={false} />
```

## 传参

| 名称           | 类型                               | 默认值 | 说明                 |
| -------------- | ---------------------------------- | ------ | -------------------- |
| `menus`        | `MenuItem[]`                       | —      | 菜单树（必填）       |
| `mode`         | `'inline' \| 'horizontal' \| 'vertical'` | — | antd Menu 方向   |
| `theme`        | `'light' \| 'dark'`                | —      | 菜单主题             |
| `collapsed`    | `boolean`                          | —      | 是否折叠（inline）   |
| `showSearch`   | `boolean`                          | `true` | 竖向菜单是否显示搜索 |
| `onSelectPath` | `(path: string) => void`           | —      | 选中叶子后回调       |
| `className`    | `string`                           | —      | 类名                 |
| `style`        | `CSSProperties`                    | —      | 样式                 |

## 依赖

- `@/types/menu`
- `@/utils/menu`
- `XnAppIcon`、react-router
