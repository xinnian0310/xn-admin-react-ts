# XnSmsCode

短信验证码：输入框 + 发送按钮，默认 60 秒倒计时。用于手机登录 / 绑定。

业务页传入 `request` 对接发送接口。返回 `{ code }` 时会弹窗展示验证码（log 通道演示）。无后端时用 `mode="local"` 只走倒计时。

## 文件

| 文件             | 说明       |
| ---------------- | ---------- |
| `index.tsx`      | 短信验证码 |
| `xnSmsCode.scss` | 布局       |

## 传参

| 名称          | 类型                                                            | 默认值               | 说明                           |
| ------------- | --------------------------------------------------------------- | -------------------- | ------------------------------ |
| `value`       | `string`                                                        | `''`                 | 验证码                         |
| `onChange`    | `(value: string) => void`                                       | —                    | 只保留数字，并截到 `maxLength` |
| `phone`       | `string`                                                        | `''`                 | 目标手机号，须为大陆 11 位     |
| `countdown`   | `number`                                                        | `60`                 | 倒计时秒数                     |
| `request`     | `(phone: string) => Promise<void \| { code?: string \| null }>` | —                    | 发送接口；`local` 模式忽略     |
| `mode`        | `'auto' \| 'local'`                                             | `'auto'`             | local 不打接口                 |
| `disabled`    | `boolean`                                                       | `false`              | 禁用                           |
| `maxLength`   | `number`                                                        | `6`                  | 验证码最大长度                 |
| `placeholder` | `string`                                                        | `'请输入短信验证码'` | 输入框占位                     |
| `sendText`    | `string`                                                        | `'获取验证码'`       | 按钮文案                       |
| `onSent`      | `(phone: string) => void`                                       | —                    | 发送成功（含 local）           |
| `onError`     | `(message: string) => void`                                     | —                    | 发送失败                       |

## Ref（`XnSmsCodeHandle`）

| 名称   | 说明         |
| ------ | ------------ |
| `send` | 触发一次发送 |

`auto` 且未传 `request` 会报「未配置短信发送请求」。手机号不合法时按钮禁用。

## 用法

```tsx
import XnSmsCode from '@/components/XnSmsCode'

<Input value={phone} onChange={(e) => setPhone(e.target.value)} />
<XnSmsCode value={code} onChange={setCode} phone={phone} request={sendSms} />
<XnSmsCode value={code} onChange={setCode} phone={phone} mode="local" />
```
