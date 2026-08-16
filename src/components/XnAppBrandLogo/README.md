# XnAppBrandLogo

品牌 Logo + 可选标题。侧栏、登录页、顶栏品牌区共用。地址与尺寸读 `appConfig.app`。

## 文件

| 文件        | 说明      |
| ----------- | --------- |
| `index.tsx` | Logo 展示 |

## 介绍

图片来自 `appConfig.app.logo`（缺省 `/xinnian-tech-logo.png`），宽高用 CSS 变量 `--app-logo-width` / `--app-logo-height`（由系统配置写入）。标题默认 `appConfig.app.name`。

与 Vue 版差异：React 不回退 Monitor 图标，而是始终渲染 `<img>`；可用 `showTitle` 控制是否显示文字。

## 使用

```tsx
import XnAppBrandLogo from '@/components/XnAppBrandLogo'

<XnAppBrandLogo />
<XnAppBrandLogo showTitle={false} />
<XnAppBrandLogo title="心念后台" />
```

## 传参

| 名称        | 类型            | 默认值 | 说明                 |
| ----------- | --------------- | ------ | -------------------- |
| `showTitle` | `boolean`       | `true` | 是否显示应用名       |
| `title`     | `string`        | —      | 覆盖 `appConfig.app.name` |
| `className` | `string`        | —      | 容器类名             |
| `style`     | `CSSProperties` | —      | 容器样式             |
