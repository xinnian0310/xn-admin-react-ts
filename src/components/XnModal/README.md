# XnModal

对 Ant Design `Modal` 的封装：默认居中、可拖拽标题栏、按系统配置限制整体高度（超出只滚 body）。业务弹窗请用本组件，不要直接用 `antd` 的 `Modal`。

## 文件

| 文件            | 说明     |
| --------------- | -------- |
| `index.tsx`     | 弹窗封装 |
| `xnModal.scss`  | 拖拽与限高样式 |

## 介绍

默认值读 `appConfig.ui.antd.modal`（`centered` / `draggable` / `maxHeight`）以及 `appConfig.ui.dialog.maxHeight`。命令式 API（`confirm` / `info` 等）只套用 `centered`，**不可拖拽**。关闭后位移归零。

## 使用

```tsx
import XnModal from '@/components/XnModal'

<XnModal
  title="编辑用户"
  open={open}
  onOk={submit}
  onCancel={() => setOpen(false)}
  width={560}
>
  <Form>...</Form>
</XnModal>
```

覆盖全局拖拽：

```tsx
<XnModal open={open} draggable={false} title="不可拖拽">
  ...
</XnModal>
```

命令式（与 antd 相同，但默认居中）：

```tsx
XnModal.confirm({ title: '确认删除？', onOk: () => remove() })
XnModal.info({ title: '提示', content: '操作成功' })
```

## 传参

继承全部 `antd` `ModalProps`，并增加：

| 名称        | 类型      | 默认值                                      | 说明                         |
| ----------- | --------- | ------------------------------------------- | ---------------------------- |
| `draggable` | `boolean` | `appConfig.ui.antd.modal.draggable`         | 是否允许拖标题栏             |
| `centered`  | `boolean` | `appConfig.ui.antd.modal.centered`          | 是否垂直居中                 |
| `open`      | `boolean` | —                                           | 显隐                         |
| 其余        | —         | antd 默认                                   | 原样传给 `Modal`             |

限高来自 `appConfig.ui.dialog.maxHeight`（其次 `ui.antd.modal.maxHeight`，默认 `80vh`）。

## 静态方法

`info` / `success` / `error` / `warning` / `confirm` / `destroyAll` / `config` / `useModal`，签名与 antd 一致。

## 说明

- 拖拽时点关闭按钮、页内按钮或输入框不会启动拖动。
- `destroyOnHidden` 优先于已废弃的 `destroyOnClose`。
- Vue 端没有独立弹窗封装，对应能力在 Element Plus `el-dialog` + 全局 `ui.dialog.maxHeight`。
