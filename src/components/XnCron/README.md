# XnCron

Quartz 六段 Cron 编辑器（秒 分 时 日 月 周）。输入框可手改，也可打开可视化面板。

## 文件

| 文件          | 说明        |
| ------------- | ----------- |
| `index.tsx`   | Cron 编辑器 |
| `xnCron.scss` | 样式        |

## 传参

| 名称          | 类型                      | 默认值                            | 说明                   |
| ------------- | ------------------------- | --------------------------------- | ---------------------- |
| `value`       | `string`                  | `'0 */5 * * * ?'`                 | Cron 表达式            |
| `onChange`    | `(value: string) => void` | —                                 | 手改或点「应用」后回写 |
| `disabled`    | `boolean`                 | `false`                           | 禁用                   |
| `placeholder` | `string`                  | `'Quartz Cron，如 0 */5 * * * ?'` | 占位                   |

## 行为说明

- 「编辑」打开 `XnDialog`，按字段切换：每 / 周期 / 区间 / 指定。
- 面板内改动先预览，点「应用」才写入 `onChange`。
- 周字段「指定」显示周一～日文案。

## 用法

```tsx
import XnCron from '@/components/XnCron'

;<XnCron value={form.cron} onChange={(cron) => setForm({ ...form, cron })} />
```
