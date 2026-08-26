# XnTreePanel

左侧树形面板：标题、过滤输入、滚动区域；可使用内置 Tree，也可传入 `children` 完全自定义。

## 文件

| 文件        | 说明   |
| ----------- | ------ |
| `index.tsx` | 树面板 |

## 介绍

常放在 `XnPageLayout` 的 `aside`（用户管理单位树、文件目录树等）。传 `data` 用内置树；传 `children` 可换成表单或其它内容（如安全策略页）。`footer` 固定在底部不随中间滚动。

## 使用

```tsx
import XnTreePanel from '@/components/XnTreePanel'

;<XnTreePanel
  title="组织"
  width={260}
  filter={keyword}
  onFilterChange={setKeyword}
  data={treeData}
  treeProps={{ label: 'name', children: 'children', key: 'id' }}
  currentKey={unitId}
  onNodeClick={(node) => setUnitId(node.id as number)}
/>
```

自定义内容（关掉搜索框）：

```tsx
<XnTreePanel title="安全策略" width={380} filterable={false}>
  <Form>...</Form>
</XnTreePanel>
```

## 传参

| 名称                | 类型                                     | 默认值   | 说明                 |
| ------------------- | ---------------------------------------- | -------- | -------------------- |
| `title`             | `string`                                 | —        | 标题                 |
| `width`             | `string \| number`                       | `240`    | 面板宽度             |
| `filterable`        | `boolean`                                | `true`   | 是否显示过滤框       |
| `filter`            | `string`                                 | `''`     | 过滤关键字（受控）   |
| `onFilterChange`    | `(value: string) => void`                | —        | 传入则走受控过滤     |
| `filterPlaceholder` | `string`                                 | `'搜索'` | 过滤占位             |
| `data`              | `T[]`                                    | `[]`     | 树数据（内置树模式） |
| `treeProps`         | `{ label?; children?; key?; disabled? }` | —        | 字段映射             |
| `currentKey`        | `string \| number`                       | —        | 当前选中键           |
| `onNodeClick`       | `(node: T) => void`                      | —        | 点击节点             |
| `children`          | `ReactNode`                              | —        | 替换内置树           |
| `footer`            | `ReactNode`                              | —        | 底部固定区           |
