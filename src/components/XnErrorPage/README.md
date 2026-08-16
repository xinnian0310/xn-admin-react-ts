# XnErrorPage

错误页。基于 Ant Design `Result`，内置 403 / 404 / 503 文案，并提供「返回首页」按钮。

## 文件

| 文件        | 说明      |
| ----------- | --------- |
| `index.tsx` | 错误页 UI |

## 介绍

与 Vue 的 `xnErrorPage`（自定义插画 + actions 插槽）不同：React 用 antd `Result` 预设，并写死跳转 `/dashboard`。`503` 在 antd 无对应 status，视觉上用 `500`。

## 使用

```tsx
import XnErrorPage from '@/components/XnErrorPage'

<XnErrorPage status={404} />
<XnErrorPage status={403} title="无权访问" subTitle="请联系管理员开通菜单。" />
<XnErrorPage status={503} />
```

## 传参

| 名称       | 类型                       | 默认值 | 说明                   |
| ---------- | -------------------------- | ------ | ---------------------- |
| `status`   | `403 \| 404 \| 500 \| 503` | `404`  | 预设文案与 Result 状态 |
| `title`    | `string`                   | 预设   | 覆盖主标题             |
| `subTitle` | `string`                   | 预设   | 覆盖说明               |

## 说明

- 无插槽。工程内用法：`pages/error/NotFoundView.tsx` 等。
- 需要自定义按钮时请直接用 antd `Result`，或改本组件。
