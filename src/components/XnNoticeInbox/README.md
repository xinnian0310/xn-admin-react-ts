# XnNoticeInbox

消息中心抽屉与公告详情。状态由 `useNoticeStore` 驱动，自身无 Props。一般挂在后台布局顶栏。

## 文件

| 文件        | 说明        |
| ----------- | ----------- |
| `index.tsx` | 消息中心 UI |

## 介绍

抽屉列出未读/已读公告与站内信，点击打开详情（HTML 正文）。WebSocket `/ws` 推送后 store 会刷新未读数。打开/关闭全部走 store。

## 使用

```tsx
import XnNoticeInbox from '@/components/XnNoticeInbox'
import { useNoticeStore } from '@/stores/notice'

<XnNoticeInbox />

useNoticeStore.getState().openDrawer()
```

## 传参 / 回调

无。

## 依赖

- `@/stores/notice`
- `@/utils/datetime`（`formatDateTime`）
