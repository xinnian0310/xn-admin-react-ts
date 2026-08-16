# 通用组件

列表页常用组合：

```
XnPageLayout
├── aside → XnTreePanel（可选）
├── search → XnSearch
├── toolbar → XnButton
└── table → XnTable
```

配置通常来自后端 page-ui（`usePageUi`）与 `<XnAuth>` / `usePermission`。

| 组件              | 说明                                   | 文档                                    |
| ----------------- | -------------------------------------- | --------------------------------------- |
| XnAppIcon         | 统一图标（Ant Design / Iconify / SVG） | [README](./XnAppIcon/README.md)         |
| XnAppBrandLogo    | 品牌 Logo                              | [README](./XnAppBrandLogo/README.md)    |
| XnAuth            | 按钮级权限（对应 Vue `v-permission`）  | [README](./XnAuth/README.md)            |
| XnButton          | 工具栏 / 行操作按钮                    | [README](./XnButton/README.md)          |
| XnErrorPage       | 403 / 404 / 503 错误页                 | [README](./XnErrorPage/README.md)       |
| XnIconPicker      | 图标选择器                             | [README](./XnIconPicker/README.md)      |
| XnImport          | Excel 导入对话框                       | [README](./XnImport/README.md)          |
| XnLongText        | 长文本截断 + 弹窗查看                  | [README](./XnLongText/README.md)        |
| XnModal           | 可拖拽、限高的 Ant Design Modal        | [README](./XnModal/README.md)           |
| XnNoticeInbox     | 消息中心抽屉                           | [README](./XnNoticeInbox/README.md)     |
| XnPageLayout      | 列表页骨架                             | [README](./XnPageLayout/README.md)      |
| XnRichEditor      | 富文本（wangEditor）                   | [README](./XnRichEditor/README.md)      |
| XnSearch          | 配置化搜索表单                         | [README](./XnSearch/README.md)          |
| XnSidebarMenu     | 多级菜单                               | [README](./XnSidebarMenu/README.md)     |
| XnTable           | 配置化表格                             | [README](./XnTable/README.md)           |
| XnTagsView        | 页面标签栏                             | [README](./XnTagsView/README.md)        |
| XnThemePicker     | 主题设置                               | [README](./XnThemePicker/README.md)     |
| XnTreePanel       | 左侧树面板                             | [README](./XnTreePanel/README.md)       |
| XnUiPreferenceFab | 个人界面偏好 FAB                       | [README](./XnUiPreferenceFab/README.md) |
| XnUpload          | 大文件分片上传                         | [README](./XnUpload/README.md)          |
