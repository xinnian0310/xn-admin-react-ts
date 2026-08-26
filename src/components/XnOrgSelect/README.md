# XnOrgSelect

组织选择器：`unit` 树 / `user` 远程搜 / `role` / `post` 下拉。传入 `options` 或 `treeData` 时不请求接口。

## 文件

| 文件        | 说明     |
| ----------- | -------- |
| `index.tsx` | 组织选择 |

## 传参

| 名称          | 类型                                               | 默认值   | 说明                                      |
| ------------- | -------------------------------------------------- | -------- | ----------------------------------------- |
| `value`       | `number \| number[] \| string \| string[] \| null` | —        | 当前值；`null` 视为未选                   |
| `onChange`    | `(value) => void`                                  | —        | 选中变化                                  |
| `type`        | `'unit' \| 'user' \| 'role' \| 'post'`             | `'unit'` | 数据类型                                  |
| `options`     | `{ id: number; label: string }[]`                  | —        | 本地扁平选项（user / role / post）        |
| `treeData`    | `{ id: number; name: string; children? }[]`        | —        | 本地单位树                                |
| `multiple`    | `boolean`                                          | `false`  | 多选；单位树为 `treeCheckable` + 严格勾选 |
| `allowClear`  | `boolean`                                          | `true`   | 可清空                                    |
| `disabled`    | `boolean`                                          | `false`  | 禁用                                      |
| `showSearch`  | `boolean`                                          | `true`   | 可搜索                                    |
| `placeholder` | `string`                                           | 随 type  | 空则：请选择单位 / 用户 / 角色 / 岗位     |
| `style`       | `CSSProperties`                                    | —        | 样式（默认 `width: 100%`）                |

## 行为说明

- `user` 远程搜：关键字请求用户列表（每页 50），展示「昵称（用户名）」；有 `options` 时改为本地过滤。
- 单位树 `fieldNames`：`label=name` / `value=id`。

## 用法

```tsx
import XnOrgSelect from '@/components/XnOrgSelect'

<XnOrgSelect value={form.unitId} onChange={(id) => setForm({ ...form, unitId: id })} type="unit" />
<XnOrgSelect value={form.userIds} onChange={setUserIds} type="user" multiple />
<XnOrgSelect value={form.roleId} onChange={setRoleId} type="role" />
<XnOrgSelect value={form.postId} onChange={setPostId} type="post" />
```
