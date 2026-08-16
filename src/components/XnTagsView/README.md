# XnTagsView

已访问路由的页签栏：横向滚动、关闭、右键菜单（刷新 / 关闭左侧 / 关闭右侧 / 关闭其它 / 关闭全部 / 全屏 / 新窗口）。

## 文件

| 文件        | 说明   |
| ----------- | ------ |
| `index.tsx` | 页签栏 |

## 介绍

状态来自 `useTagsViewStore` + 当前路由，无 Props。Affix 页签（如首页）不可关闭。刷新走 `/redirect` 路径以重建页面。全屏由 store 的 `isFullscreen` 控制，布局会隐藏侧栏/顶栏。

React 端 `cachedViews` 已记录，但尚未挂到页面级 Keep-alive（见 `SYNC.md`）。

## 使用

挂载于后台布局内容区上方即可：

```tsx
import XnTagsView from '@/components/XnTagsView'

;<XnTagsView />
```

## 传参 / 回调

无。

## 依赖

- `@/stores/tagsView`
- `@/types/menu`（`TagView`）
