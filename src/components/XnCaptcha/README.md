# XnCaptcha

登录验证码：图形输入或滑块。`mode=auto` 请求 `/auth/captcha`；`mode=local` 前端生成，供演示。

## 文件

| 文件             | 说明   |
| ---------------- | ------ |
| `index.tsx`      | 验证码 |
| `xnCaptcha.scss` | 样式   |

## 传参

| 名称                | 类型                                                             | 默认值   | 说明                                          |
| ------------------- | ---------------------------------------------------------------- | -------- | --------------------------------------------- |
| `value`             | `string`                                                         | `''`     | 图形验证码输入值                              |
| `onChange`          | `(value: string) => void`                                        | —        | 输入变化；刷新时若当前有值会清空              |
| `captchaId`         | `string`                                                         | `''`     | 验证码 ID                                     |
| `onCaptchaIdChange` | `(value: string) => void`                                        | —        | ID 变化                                       |
| `mode`              | `'auto' \| 'local'`                                              | `'auto'` | auto 打接口；local 前端生成                   |
| `type`              | `'IMAGE' \| 'SLIDER'`                                            | —        | 不传时：auto 跟后端 `captchaType`，否则 IMAGE |
| `disabled`          | `boolean`                                                        | `false`  | 禁用                                          |
| `onVerified`        | `(ok: boolean) => void`                                          | —        | 滑块校验结果；刷新时为 `false`                |
| `onPayloadChange`   | `(payload: { captchaId: string; captchaCode?: string }) => void` | —        | 拉码 / 输入 / 滑块通过时回传                  |

## Ref（`XnCaptchaHandle`）

| 名称         | 说明                         |
| ------------ | ---------------------------- |
| `refresh`    | 重新拉码                     |
| `getPayload` | `{ captchaId, captchaCode }` |
| `captchaId`  | 当前 ID                      |

## 行为说明

- 挂载时拉一次。刷新仅在 `value` 非空时才 `onChange('')`，已是空值不会回写。
- 图形码输入框 `maxLength` 为 6；点击图片刷新。
- 登录提交带 `{ captchaId, captchaCode }`。

## 用法

```tsx
import XnCaptcha from '@/components/XnCaptcha'

<XnCaptcha
  value={code}
  onChange={setCode}
  captchaId={captchaId}
  onCaptchaIdChange={setCaptchaId}
/>
<XnCaptcha value={code} onChange={setCode} mode="local" type="IMAGE" />
```
