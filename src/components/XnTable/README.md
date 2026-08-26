# XnTable

配置驱动表格：支持 **data 模式**（外部数据）与 **api 模式**（按模块名加载 CRUD API）。内置列类型、分页、列设置。

多数业务页用 data 模式：页面自己拉数，把 `data` / `total` / `loading` 传进来。设置 `tableKey` 后底部分页出现「列设置」，配置写入 `/api/table-columns`。

自定义列用 `slots` 字典，而不是 Vue 具名插槽。保存弹窗由页面自己渲染。

## 文件

| 文件                       | 说明                     |
| -------------------------- | ------------------------ |
| `index.tsx`                | 主表格                   |
| `xnTable.scss`             | 表格样式                 |
| `ColumnSettingDialog.tsx`  | 列显示 / 排序 / 宽度弹窗 |
| `columnSettingDialog.scss` | 列设置样式               |

## 传参

| 名称               | 类型                                            | 默认值              | 说明                            |
| ------------------ | ----------------------------------------------- | ------------------- | ------------------------------- |
| `data`             | `unknown[]`                                     | —                   | 数据模式；与 `api` 二选一       |
| `api`              | `string`                                        | —                   | API 模式，对应 `@/api/{api}.ts` |
| `columns`          | `TableColumnItem[]`                             | `[]`                | 列配置                          |
| `loading`          | `boolean`                                       | —                   | 数据模式加载态                  |
| `showPagination`   | `boolean`                                       | `true`              | 是否分页                        |
| `page`             | `number`                                        | `1`                 | 当前页                          |
| `pageSize`         | `number`                                        | `10`                | 每页条数                        |
| `total`            | `number`                                        | `0`                 | 总条数（data 模式）             |
| `pageSizes`        | `number[]`                                      | `[10, 20, 50, 100]` | 每页条数选项                    |
| `queryParams`      | `Record<string, unknown>`                       | —                   | 查询参数（api 模式）            |
| `listFilter`       | `(row) => boolean`                              | —                   | 客户端过滤                      |
| `idField`          | `string`                                        | `'id'`              | 主键字段（api 删除用）          |
| `immediate`        | `boolean`                                       | `true`              | 挂载后是否立即拉数（api 模式）  |
| `tableKey`         | `string`                                        | —                   | 有值则启用列设置持久化          |
| `actionItems`      | `ButtonListItem[]`                              | —                   | 操作列按钮                      |
| `rowKey`           | `string \| (row) => Key`                        | `'id'`              | 行键                            |
| `emptyType`        | `'data' \| 'permission' \| 'search' \| 'error'` | `'data'`            | 空状态预设                      |
| `emptyDescription` | `string`                                        | —                   | 覆盖空状态副文案                |
| `slots`            | `Record<string, (ctx) => ReactNode>`            | —                   | 自定义列渲染                    |

类型里还有 `tableHeight` / `stripe` / `entityName` / `nameField`，当前实现未使用。

## 回调

| 名称                | 签名                                         |
| ------------------- | -------------------------------------------- |
| `onPageChange`      | `(page, pageSize) => void`                   |
| `onRefresh`         | `() => void`（data 模式优先于 onPageChange） |
| `onSelectionChange` | `(rows) => void`                             |
| `onSwitchChange`    | `({ row, prop, value }) => void`             |
| `onDataChange`      | `(rows) => void`（api 模式拉数后）           |
| `onSuccess`         | `() => void`（api 删除成功）                 |

## Ref（`XnTableHandle`）

| 名称           | 说明                                |
| -------------- | ----------------------------------- |
| `openSave`     | 空实现，需页面自己处理保存弹窗      |
| `handleDelete` | 删除指定行（需 `api`）              |
| `handleAction` | 目前仅 `delete` 会调 `handleDelete` |
| `loadData`     | 重新加载（api 模式）                |
| `selected`     | 当前选中                            |
| `getApi`       | 当前 CRUD API 模块                  |

## 列类型（`TableColumnItem.type`）

`selection` | `index` | `text`（默认） | `datetime` | `tag` | `switch` | `iconText` | `longText` | `slot`

`longText` 使用 `XnLongText`。`type: 'selection'` 启用多选。操作列可用 `slots.actions` 或 `actionItems`。

## 用法

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
  actionItems={tableButtonItems}
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
