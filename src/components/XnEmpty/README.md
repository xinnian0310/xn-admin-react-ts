# XnEmpty

列表 / 卡片的统一空状态：无数据、无权限、无搜索结果、加载失败。

## 文件

| 文件           | 说明   |
| -------------- | ------ |
| `index.tsx`    | 空状态 |
| `xnEmpty.scss` | 样式   |

## 传参

| 名称          | 类型                                            | 默认值      | 说明                         |
| ------------- | ----------------------------------------------- | ----------- | ---------------------------- |
| `type`        | `'data' \| 'permission' \| 'search' \| 'error'` | `'data'`    | 预设文案与图标               |
| `title`       | `string`                                        | 随 type     | 覆盖主标题                   |
| `description` | `string`                                        | 随 type     | 覆盖副文案；传 `''` 可隐藏   |
| `size`        | `'default' \| 'small'`                          | `'default'` | 表格内用 small               |
| `children`    | `ReactNode`                                     | —           | 底部附加区（如「重新加载」） |

预设：`data` 暂无数据 / `permission` 暂无权限 / `search` 无匹配结果 / `error` 加载失败。

## 用法

```tsx
import XnEmpty from '@/components/XnEmpty'

<XnEmpty type="search" />
<XnEmpty type="error">
  <Button onClick={reload}>重新加载</Button>
</XnEmpty>
```
