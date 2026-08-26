# XnSearch

配置驱动的行内搜索表单。字段过多时折叠，提供查询 / 重置。

## 文件

| 文件            | 说明     |
| --------------- | -------- |
| `index.tsx`     | 搜索表单 |
| `xnSearch.scss` | 样式     |

## 介绍

`searchItem` 通常来自 `usePageUi(routePath).searchItems`（后端 page-ui）。查询时剥离空值再回调 `onQueryForm`。默认只展示前 `collapseCount` 项，其余点「展开」。

与 Vue 差异：无 `height` / `fieldWidth` / 默认插槽；折叠按条数而不是按容器宽度重算。

## 使用

```tsx
import XnSearch from '@/components/XnSearch'

;<XnSearch
  searchItem={searchItems}
  collapseCount={3}
  onQueryForm={(form) => {
    setQuery(form)
    load()
  }}
  onReset={() => {
    setQuery({})
    load()
  }}
/>
```

## 传参

| 名称            | 类型                         | 默认值 | 说明               |
| --------------- | ---------------------------- | ------ | ------------------ |
| `searchItem`    | `SearchItem[]`               | `[]`   | 搜索项配置         |
| `collapseCount` | `number`                     | `3`    | 折叠时可见项数     |
| `onQueryForm`   | `(form: SearchForm) => void` | —      | 查询（空值已剥离） |
| `onReset`       | `(form: SearchForm) => void` | —      | 重置               |

## 字段类型（`SearchItem.type`）

`input` | `number` | `select` | `date` | `datetime` | `daterange` | `dict` | `region`

`dict` 使用 `XnDictSelect`（`dictType` / `options`）；`region` 使用 `XnRegion`（`level`）。

`SearchItem`（`@/types/search`）：`label`、`prop`、`type`，以及可选 `options` / `dictType` / `level` / `width` / `clearable` / `multiple`。
