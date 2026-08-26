# XnRegion

省市区级联。内置中国行政区划（含非省会区县）。传入 `options` 可完全自定义。

`value` 默认是区划代码数组。`valueType` 可改为 `labels`（名称数组）或 `text`（拼接字符串）。`onChange(value, extra)` 始终给出 `value` / `labels` / `text`。

## 文件

| 文件        | 说明   |
| ----------- | ------ |
| `index.tsx` | 省市区 |

## 传参

| 名称            | 类型                                               | 默认值     | 说明                                       |
| --------------- | -------------------------------------------------- | ---------- | ------------------------------------------ |
| `value`         | `string[] \| string`                               | —          | 随 `valueType`：代码 / 名称数组 / 拼接文案 |
| `onChange`      | `(value, extra?: { value; labels; text }) => void` | —          | 选中变化                                   |
| `options`       | `RegionNode[]`                                     | 内置省市区 | 传入后不再使用内置数据                     |
| `level`         | `2 \| 3`                                           | `3`        | 2=省市，3=省市区                           |
| `valueType`     | `'codes' \| 'labels' \| 'text'`                    | `'codes'`  | 回写形态                                   |
| `separator`     | `string`                                           | `' / '`    | `text` 模式拼接符                          |
| `clearable`     | `boolean`                                          | `true`     | 可清空                                     |
| `disabled`      | `boolean`                                          | `false`    | 禁用                                       |
| `filterable`    | `boolean`                                          | `true`     | 可搜索                                     |
| `checkStrictly` | `boolean`                                          | `false`    | 为真时可只选到中间级（`changeOnSelect`）   |
| `placeholder`   | `string`                                           | 随 level   | 空则「请选择省 / 市」或带「/ 区」          |
| `style`         | `CSSProperties`                                    | —          | 样式                                       |
| `className`     | `string`                                           | —          | 类名                                       |

展开触发为 hover。

## 用法

```tsx
import XnRegion from '@/components/XnRegion'

<XnRegion value={codes} onChange={setCodes} />
<XnRegion value={codes} onChange={setCodes} level={2} />
<XnRegion value={text} onChange={setText} valueType="text" separator=" / " />
```
