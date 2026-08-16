# XnIconPicker

图标选择表单控件。从 Ant Design / Iconify 预设 / 本地 SVG 中挑选，受控 `value` / `onChange`。路由管理、权限内容等「选图标」字段用它。

## 文件

| 文件        | 说明       |
| ----------- | ---------- |
| `index.tsx` | 图标选择器 |
| `index.css` | 面板样式   |

## 介绍

三个 Tab：`antd` / `iconify` / `svg`。选中值交给 `XnAppIcon` 渲染。Ant Design 列表可搜索；Iconify 可输入 `prefix:name`（如 `mdi:home`）。禁用时不可打开。

## 使用

```tsx
import XnIconPicker from '@/components/XnIconPicker'

;<XnIconPicker
  value={form.iconAntd}
  onChange={(v) => setForm({ ...form, iconAntd: v })}
  placeholder="选择 Ant / Iconify / SVG 图标"
/>
```

配合 Form：

```tsx
<Form.Item name="iconAntd" label="图标">
  <XnIconPicker />
</Form.Item>
```

## 传参

| 名称          | 类型                      | 默认值                            | 说明       |
| ------------- | ------------------------- | --------------------------------- | ---------- |
| `value`       | `string`                  | `''`                              | 当前图标值 |
| `onChange`    | `(value: string) => void` | —                                 | 选中变更   |
| `placeholder` | `string`                  | `'选择 Ant / Iconify / SVG 图标'` | 占位       |
| `disabled`    | `boolean`                 | `false`                           | 禁用       |

## 依赖

- `XnAppIcon`
- `@/utils/icons`（`ICONIFY_PRESETS`、`listAntdIconNames`、`listSvgIconNames`）
