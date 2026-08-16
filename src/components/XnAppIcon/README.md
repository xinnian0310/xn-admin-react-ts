# XnAppIcon

统一图标渲染。支持 Ant Design 图标、Iconify、本地 SVG。菜单、按钮、路由管理、图标选择器都走这一套。

## 文件

| 文件        | 说明         |
| ----------- | ------------ |
| `index.tsx` | 图标渲染入口 |

## 介绍

`name` 经 `@/utils/icons` 的 `parseIcon` 识别类型。React 端菜单优先 `iconAntd`，没有再回退 `icon`（Element 名会尽量映射）。

| 写法 | 类型 | 示例 |
| --- | --- | --- |
| Ant Design 组件名 | antd | `SettingOutlined`、`UserOutlined` |
| 含 `:` | Iconify | `mdi:home` |
| `svg:` 前缀 | 本地 SVG | `svg:my-icon` |

无法解析或 `name` 为空时不渲染。

## 使用

```tsx
import XnAppIcon from '@/components/XnAppIcon'

<XnAppIcon name="SettingOutlined" size={18} />
<XnAppIcon name="mdi:home" style={{ color: '#1677ff' }} />
<XnAppIcon name="svg:my-icon" />
```

## 传参

| 名称        | 类型                 | 默认值 | 说明                                      |
| ----------- | -------------------- | ------ | ----------------------------------------- |
| `name`      | `string \| null`     | —      | 图标名                                    |
| `size`      | `number \| string`   | `16`   | 尺寸（数字按 px）                         |
| `className` | `string`             | —      | 类名                                      |
| `style`     | `CSSProperties`      | —      | 内联样式（可设 `color`）                  |

## 依赖

- `@/utils/icons`：`parseIcon`、`resolveAntdIcon`、`getSvgRaw`、`resolveIconifyName`
- `@iconify/react`
- `@ant-design/icons`
