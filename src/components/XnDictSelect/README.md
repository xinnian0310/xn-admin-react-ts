# XnDictSelect

按字典类型拉启用项，包 Ant Design `Select`。传入 `options` 时不请求接口（演示 / 离线）。

## 文件

| 文件        | 说明     |
| ----------- | -------- |
| `index.tsx` | 字典下拉 |

## 传参

| 名称          | 类型                                                  | 默认值     | 说明                            |
| ------------- | ----------------------------------------------------- | ---------- | ------------------------------- |
| `value`       | `string \| number \| Array<string \| number> \| null` | —          | 当前值；空串 / `null` 视为未选  |
| `onChange`    | `(value) => void`                                     | —          | 选中变化                        |
| `dictType`    | `string`                                              | `''`       | 字典类型；有 `options` 时可不传 |
| `options`     | `{ label: string; value: string \| number }[]`        | —          | 本地选项，传入后不再请求        |
| `multiple`    | `boolean`                                             | `false`    | 多选                            |
| `allowClear`  | `boolean`                                             | `true`     | 可清空                          |
| `disabled`    | `boolean`                                             | `false`    | 禁用                            |
| `showSearch`  | `boolean`                                             | `true`     | 可搜索（按 label）              |
| `placeholder` | `string`                                              | `'请选择'` | 占位                            |
| `style`       | `CSSProperties`                                       | —          | 样式（默认 `width: 100%`）      |
| `className`   | `string`                                              | —          | 类名                            |

## 行为说明

- 远程选项按 `status !== 0` 过滤、按 `sort` 排序，同 `dictType` 会缓存 Promise。
- 空值会转成 `undefined` 交给 Select，避免受控空串警告。

## 用法

```tsx
import XnDictSelect from '@/components/XnDictSelect'

<XnDictSelect value={status} onChange={setStatus} dictType="sys_user_status" />
<XnDictSelect value={status} onChange={setStatus} options={[{ label: '启用', value: '1' }]} />
```
