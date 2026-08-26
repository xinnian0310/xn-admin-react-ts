# XnDialog

业务弹窗壳：统一取消 / 确定页脚、关闭销毁、内容区 loading。内部包 `XnModal`（拖拽、限高）。

业务表单 / 确认弹窗用本组件；需要命令式 `confirm` / `info` 或完全自定义页脚时再用 `XnModal`。

## 文件

| 文件            | 说明       |
| --------------- | ---------- |
| `index.tsx`     | 弹窗封装   |
| `xnDialog.scss` | 全屏标题栏 |

## 传参

| 名称              | 类型                              | 默认值      | 说明                              |
| ----------------- | --------------------------------- | ----------- | --------------------------------- |
| `open`            | `boolean`                         | —           | 显隐                              |
| `title`           | `ReactNode`                       | `''`        | 标题                              |
| `children`        | `ReactNode`                       | —           | 内容                              |
| `size`            | `'small' \| 'default' \| 'large'` | `'default'` | 宽度预设 420 / 560 / 720          |
| `width`           | `string \| number`                | 随 size     | 传入则覆盖 size                   |
| `loading`         | `boolean`                         | `false`     | 内容区 Spin，拉详情时用           |
| `showFullscreen`  | `boolean`                         | `false`     | 标题栏全屏切换                    |
| `fullscreen`      | `boolean`                         | `false`     | 受控全屏初值                      |
| `confirmLoading`  | `boolean`                         | `false`     | 确定按钮 loading                  |
| `onConfirm`       | `() => void`                      | —           | 点确定                            |
| `onCancel`        | `() => void`                      | —           | 点取消 / 关闭                     |
| `footer`          | `ReactNode`                       | 取消 / 确定 | 自定义页脚；`null` 隐藏           |
| `showFooter`      | `boolean`                         | `true`      | 是否显示默认页脚                  |
| `showCancel`      | `boolean`                         | `true`      | 默认页脚是否显示取消              |
| `showConfirm`     | `boolean`                         | `true`      | 默认页脚是否显示确定              |
| `cancelText`      | `string`                          | `'取消'`    | 取消文案                          |
| `confirmText`     | `string`                          | `'确定'`    | 确定文案                          |
| `confirmDisabled` | `boolean`                         | `false`     | 确定按钮禁用                      |
| `destroyOnClose`  | `boolean`                         | `true`      | 关闭销毁                          |
| `afterClose`      | `() => void`                      | —           | 关闭动画结束后                    |
| `closable`        | `boolean`                         | `true`      | 右上角关闭                        |
| `maskClosable`    | `boolean`                         | `false`     | 点击遮罩关闭                      |
| `keyboard`        | `boolean`                         | `true`      | ESC 关闭                          |
| `centered`        | `boolean`                         | —           | 垂直居中；不传则跟 `XnModal` 配置 |
| `draggable`       | `boolean`                         | —           | 拖标题栏；不传则跟 `XnModal` 配置 |
| `className`       | `string`                          | —           | 附加类名                          |

## 行为说明

- 全屏时宽度 100%、`top: 0`，并关闭居中与拖拽。关闭后恢复为 `fullscreen` 初值。
- `footer` 传入（含 `null`）时覆盖默认页脚；`showFooter={false}` 也隐藏默认页脚。

## 用法

```tsx
import XnDialog from '@/components/XnDialog'

<XnDialog open={open} title="编辑用户" confirmLoading={saving} onCancel={() => setOpen(false)} onConfirm={submit}>
  <Form>...</Form>
</XnDialog>

<XnDialog open={open} title="定时任务" width={640} showFullscreen loading={detailLoading} onCancel={close} onConfirm={submit}>
  <Form>...</Form>
</XnDialog>
```
