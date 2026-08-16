# XnRichEditor

基于 wangEditor 的富文本编辑器封装，受控 `value` / `onChange` 绑定 HTML 字符串。公告、站内信正文使用。

## 文件

| 文件        | 说明         |
| ----------- | ------------ |
| `index.tsx` | 富文本编辑器 |

逻辑在 `@/utils/rich-editor`。

## 介绍

图片 / 视频 / 附件上传走项目 `UploadManager`（与 XnUpload 同一套：秒传、分片、续传）。已注册官方插件：Markdown、公式、@提及、上传附件、链接卡片、Ctrl+Enter 换行。`disabled` 时隐藏工具栏并只读。卸载时销毁编辑器实例。

只读页展示请用 `decorateRichHtml`，否则公式节点是空 span。

## 使用

```tsx
import XnRichEditor from '@/components/XnRichEditor'

;<XnRichEditor
  value={form.content}
  onChange={(html) => setForm({ ...form, content: html })}
  height="400px"
  placeholder="请输入公告内容"
/>
```

配合 Form：

```tsx
<Form.Item name="content" label="正文">
  <XnRichEditor height={360} />
</Form.Item>
```

## 传参

| 名称          | 类型                     | 默认值             | 说明                    |
| ------------- | ------------------------ | ------------------ | ----------------------- |
| `value`       | `string`                 | `''`               | HTML 内容               |
| `onChange`    | `(html: string) => void` | —                  | 内容变化                |
| `disabled`    | `boolean`                | `false`            | 只读/禁用（隐藏工具栏） |
| `height`      | `string \| number`       | `'320px'`          | 编辑区高度              |
| `placeholder` | `string`                 | `'请输入公告内容'` | 占位文案                |

## 依赖

- `@wangeditor/editor`
- `@wangeditor/editor-for-react`
- 与 Vue 端相同的 wangEditor 插件（Markdown / 公式 / 提及 / 附件 / 链接卡片 / Ctrl+Enter）
