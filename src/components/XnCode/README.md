# XnCode

JSON / 代码查看：行号、复制、JSON 着色与格式化。解析失败时按原文展示。

## 文件

| 文件          | 说明     |
| ------------- | -------- |
| `index.tsx`   | 代码查看 |
| `xnCode.scss` | 样式     |

## 传参

| 名称        | 类型                                         | 默认值    | 说明                        |
| ----------- | -------------------------------------------- | --------- | --------------------------- |
| `value`     | `unknown`                                    | `''`      | 源内容                      |
| `language`  | `'json' \| 'text' \| 'java' \| 'js' \| 'ts'` | `'text'`  | 仅 `json` 会着色与格式化    |
| `title`     | `string`                                     | `''`      | 顶栏标题；空则显示语言大写  |
| `maxHeight` | `string`                                     | `'280px'` | 内容区最大高度              |
| `showCopy`  | `boolean`                                    | `true`    | 是否显示复制（走 `XnCopy`） |
| `style`     | `CSSProperties`                              | —         | 容器样式                    |
| `className` | `string`                                     | —         | 容器类名                    |

无标题且 `showCopy` 为假时不渲染顶栏。

## 用法

```tsx
import XnCode from '@/components/XnCode'

<XnCode title="请求参数" language="json" value={row.params} />
<XnCode title="堆栈" language="text" value={row.stackTrace} />
```
