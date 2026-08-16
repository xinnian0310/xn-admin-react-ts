# XnThemePicker

主题设置对话框：预设主题、浅色/深色外观、自定义配色与主内容区背景图。

## 文件

| 文件        | 说明         |
| ----------- | ------------ |
| `index.tsx` | 主题设置弹窗 |

## 介绍

无 Props。显隐由 `themeStore.dialogVisible` 控制。本工程只读写后端 `ui.antd`，与 Vue 的 `ui.elementPlus` 互不覆盖。背景图限制约 800KB，以 data URL 存本地。

布局中挂载 `<XnThemePicker />`，顶栏入口调用 `themeStore.openDialog()`。

## 使用

```tsx
import XnThemePicker from '@/components/XnThemePicker'
import { useThemeStore } from '@/stores/theme'

<XnThemePicker />

// 打开
useThemeStore.getState().openDialog()
```

## 传参 / 回调

无。

## 依赖

- `@/stores/theme`
- `@/config/themes`
- `XnModal`
