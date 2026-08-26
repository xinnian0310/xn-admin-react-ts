# XnPageLayout

后台列表页骨架：可选左侧树、搜索区、工具栏、表格/卡片切换、分页。绝大多数 CRUD 列表页都包一层本组件。

## 文件

| 文件                | 说明         |
| ------------------- | ------------ |
| `index.tsx`         | 页面布局骨架 |
| `xnPageLayout.scss` | 布局样式     |

## 介绍

React 用 **props 插槽**（`aside` / `search` / `toolbar` / `table`…）而不是 Vue 具名 slot。有 `aside` 时左右分栏。有 `card` 且 `showViewSwitch` 为真时才显示表格 / 卡片切换；模式写入 `localStorage`（键 `xn-view-mode:{pathname}`）。`children` 始终接在当前视图后面，不是 table/card 的替代。

## 使用

```tsx
import XnPageLayout from '@/components/XnPageLayout'

;<XnPageLayout
  aside={<XnTreePanel title="单位" data={tree} onNodeClick={onNode} />}
  search={<XnSearch searchItem={searchItems} onQueryForm={onQuery} onReset={onReset} />}
  toolbar={<XnButton listItem={buttonItems} selected={selected} onButtonClick={onToolbar} />}
  table={<XnTable data={rows} columns={columns} total={total} loading={loading} />}
  showPagination
  page={page}
  pageSize={pageSize}
  total={total}
  loading={loading}
  onPageChange={(p, s) => {
    setPage(p)
    setPageSize(s)
    load()
  }}
/>
```

## 传参

| 名称               | 类型                       | 默认值   | 说明                         |
| ------------------ | -------------------------- | -------- | ---------------------------- |
| `aside`            | `ReactNode`                | —        | 左侧面板                     |
| `search`           | `ReactNode`                | —        | 搜索区                       |
| `toolbar`          | `ReactNode`                | —        | 工具栏左侧                   |
| `toolbarExtra`     | `ReactNode`                | —        | 工具栏右侧（视图切换前）     |
| `table`            | `ReactNode`                | —        | 表格视图                     |
| `card`             | `ReactNode`                | —        | 卡片视图                     |
| `pagination`       | `ReactNode`                | —        | 自定义分页                   |
| `children`         | `ReactNode`                | —        | 接在 table/card 后的附加内容 |
| `viewMode`         | `'table' \| 'card'`        | 内部状态 | 受控视图模式                 |
| `onViewModeChange` | `(mode) => void`           | —        | 视图切换                     |
| `showViewSwitch`   | `boolean`                  | `true`   | 是否显示表格/卡片切换        |
| `showPagination`   | `boolean`                  | `false`  | 是否显示分页                 |
| `page`             | `number`                   | `1`      | 当前页                       |
| `pageSize`         | `number`                   | `10`     | 每页条数                     |
| `total`            | `number`                   | `0`      | 总条数                       |
| `loading`          | `boolean`                  | `false`  | 加载态（Spin 包裹）          |
| `onPageChange`     | `(page, pageSize) => void` | —        | 分页变化                     |
