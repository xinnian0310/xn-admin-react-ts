# XnTagsView

已访问路由的页签栏：横向滚动、关闭、右键菜单。状态来自 `useTagsViewStore` + 当前路由，无 Props。

## 文件

| 文件              | 说明   |
| ----------------- | ------ |
| `index.tsx`       | 页签栏 |
| `xnTagsView.scss` | 样式   |

## 传参 / 回调

无。

## 行为说明

- Affix 页签（如首页）不可关闭。关到只剩一个会跳 `/dashboard`。
- 右键菜单（以代码为准）：刷新 / 关闭 / 关闭其他 / 关闭左侧 / 关闭右侧 / 关闭全部 / 内容全屏。
- 刷新走 `/redirect{path}` 以重建页面。
- 内容全屏调用 `tagsViewStore.toggleFullscreen()`，布局会隐藏侧栏 / 顶栏。
- 标签超出宽度时两端出现左右箭头；滚轮竖向滚动会转成横向滚动。
- 激活页签变化或增删后会滚入可视区。
- `cachedViews` 仍写入 store，但尚未挂到页面级 keep-alive。

## 用法

挂载于后台布局内容区上方即可：

```tsx
import XnTagsView from '@/components/XnTagsView'

;<XnTagsView />
```
