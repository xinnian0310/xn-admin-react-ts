# XnTable

配置驱动表格：支持 **data 模式**（外部数据）与 **api 模式**（按模块名加载 CRUD API）。内置列类型、分页、列设置。

## 文件

| 文件                      | 说明                     |
| ------------------------- | ------------------------ |
| `index.tsx`               | 主表格                   |
| `ColumnSettingDialog.tsx` | 列显示/排序/宽度设置弹窗 |

## 介绍

多数业务页用 data 模式：页面自己拉数，把 `data` / `total` / `loading` 传进来。`api` 模式按模块名加载 `@/api/{api}.ts` 的 CRUD。设置 `tableKey` 后底部分页出现「列设置」，配置写入 `/api/table-columns`。

自定义列用 `slots` 字典，而不是 Vue 具名插槽。保存弹窗由页面自己渲染，本组件不接收 `saveComponent`。

## 使用

```tsx
import XnTable from '@/components/XnTable'

<XnTable
  data={rows}
  columns={columns}
  loading={loading}
  total={total}
  page={page}
  pageSize={size}
  tableKey="system:roles"
  entityName="角色"
  nameField="name"
  actionItems={tableButtonItems}
  stripe
  onSelectionChange={setSelected}
  onPageChange={(p, s) => { setPage(p); setSize(s) }}
  slots={{
    status: ({ row }) => <Switch checked={row.status === 1} onChange={...} />,
  }}
/>
```

API 模式：

```tsx
<XnTable ref={tableRef} api="user" tableKey="users" columns={columns} queryParams={query} />
```

```ts
tableRef.current?.loadData()
tableRef.current?.openSave('edit', id)
```

## 传参

| 名称                          | 类型                                 | 默认值           | 说明                            |
| ----------------------------- | ------------------------------------ | ---------------- | ------------------------------- |
| `data`                        | `unknown[]`                          | —                | 数据模式；与 `api` 二选一       |
| `api`                         | `string`                             | —                | API 模式，对应 `@/api/{api}.ts` |
| `columns`                     | `TableColumnItem[]`                  | `[]`             | 列配置                          |
| `loading`                     | `boolean`                            | `false`          | 数据模式加载态                  |
| `tableHeight`                 | `string \| number`                   | —                | 表格高度                        |
| `showPagination`              | `boolean`                            | `true`           | 是否分页                        |
| `page` / `pageSize` / `total` | `number`                             | `1` / `10` / `0` | 分页                            |
| `pageSizes`                   | `number[]`                           | —                | 每页条数选项                    |
| `queryParams`                 | `Record<string, unknown>`            | —                | 查询参数（api 模式）            |
| `listFilter`                  | `(row) => boolean`                   | —                | 客户端过滤                      |
| `entityName`                  | `string`                             | —                | 实体中文名                      |
| `nameField`                   | `string`                             | —                | 名称字段                        |
| `idField`                     | `string`                             | —                | 主键字段                        |
| `immediate`                   | `boolean`                            | —                | 挂载后是否立即拉数（api 模式）  |
| `tableKey`                    | `string`                             | —                | 有值则启用列设置持久化          |
| `actionItems`                 | `ButtonListItem[]`                   | —                | 操作列按钮                      |
| `stripe`                      | `boolean`                            | —                | 斑马纹                          |
| `rowKey`                      | `string \| (row) => Key`             | —                | 行键                            |
| `slots`                       | `Record<string, (ctx) => ReactNode>` | —                | 自定义列渲染                    |

## 回调

| 名称                | 签名                                         |
| ------------------- | -------------------------------------------- |
| `onPageChange`      | `(page, pageSize) => void`                   |
| `onRefresh`         | `() => void`（data 模式优先于 onPageChange） |
| `onSelectionChange` | `(rows) => void`                             |
| `onSwitchChange`    | `({ row, prop, value }) => void`             |
| `onDataChange`      | `(rows) => void`                             |
| `onSuccess`         | `() => void`                                 |

## Ref（`XnTableHandle`）

| 名称           | 说明                                 |
| -------------- | ------------------------------------ |
| `openSave`     | `(mode, id?)` 打开保存（需页面配合） |
| `handleDelete` | 删除指定行                           |
| `handleAction` | `add` / `edit` / `view` / `delete`   |
| `loadData`     | 重新加载（api 模式）                 |
| `selected`     | 当前选中                             |
| `getApi`       | 当前 CRUD API 模块                   |

## 列类型（`TableColumnItem.type`）

`selection` | `index` | `text`（默认） | `datetime` | `tag` | `switch` | `iconText` | `longText` | `slot`

`longText` 使用 `XnLongText`。
