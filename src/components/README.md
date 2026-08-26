# 通用组件

列表页常用组合：

```
XnPageLayout
├── aside → XnTreePanel（可选）
├── search → XnSearch
├── toolbar → XnButton + XnExport
└── table → XnTable
```

配置通常来自后端 page-ui（`usePageUi`）与 `<XnAuth>` / `usePermission`。

`XnDialog` 是业务弹窗（默认取消 / 确定）；`XnModal` 是底层 Ant Design Modal 封装（拖拽、限高）。业务页优先用 `XnDialog`。

分类速览：

- **布局与导航**：XnPageLayout、XnSidebarMenu、XnTagsView、XnTreePanel、XnAppBrandLogo、XnAppIcon
- **列表页**：XnSearch、XnButton、XnTable、XnExport、XnImport、XnEmpty
- **表单与选择**：XnDictSelect、XnOrgSelect、XnRegion、XnCron、XnIconPicker、XnRichEditor、XnCaptcha、XnSmsCode、XnCopy、XnCode、XnDesc、XnLongText
- **弹层**：XnDialog、XnModal、XnPopconfirm、XnNoticeInbox、XnThemePicker、XnUiPreferenceFab
- **上传与文件**：XnUpload、XnImageUpload、XnFilePicker、XnAvatarCrop
- **其它**：XnAuth、XnErrorPage、XnWatermark

| 组件              | 说明                                   | 文档                                    |
| ----------------- | -------------------------------------- | --------------------------------------- |
| XnAppIcon         | 统一图标（Ant Design / Iconify / SVG） | [README](./XnAppIcon/README.md)         |
| XnAppBrandLogo    | 品牌 Logo                              | [README](./XnAppBrandLogo/README.md)    |
| XnAuth            | 按钮级权限（对应 Vue `v-permission`）  | [README](./XnAuth/README.md)            |
| XnAvatarCrop      | 头像裁剪上传                           | [README](./XnAvatarCrop/README.md)      |
| XnButton          | 工具栏 / 行操作按钮                    | [README](./XnButton/README.md)          |
| XnCaptcha         | 图形 / 滑块验证码                      | [README](./XnCaptcha/README.md)         |
| XnCode            | JSON / 代码查看（行号、复制、着色）    | [README](./XnCode/README.md)            |
| XnCopy            | 一键复制按钮                           | [README](./XnCopy/README.md)            |
| XnCron            | Quartz Cron 编辑器                     | [README](./XnCron/README.md)            |
| XnDesc            | 详情描述列表                           | [README](./XnDesc/README.md)            |
| XnDialog          | 业务弹窗壳（内部用 `XnModal`）         | [README](./XnDialog/README.md)          |
| XnDictSelect      | 字典下拉                               | [README](./XnDictSelect/README.md)      |
| XnEmpty           | 无数据 / 无权限等空状态                | [README](./XnEmpty/README.md)           |
| XnErrorPage       | 403 / 404 / 503 错误页                 | [README](./XnErrorPage/README.md)       |
| XnExport          | 导出按钮                               | [README](./XnExport/README.md)          |
| XnFilePicker      | 从已上传文件中选择                     | [README](./XnFilePicker/README.md)      |
| XnIconPicker      | 图标选择器                             | [README](./XnIconPicker/README.md)      |
| XnImport          | Excel 导入对话框                       | [README](./XnImport/README.md)          |
| XnImageUpload     | 图片上传（单张 / 多张 + 预览）         | [README](./XnImageUpload/README.md)     |
| XnLongText        | 长文本截断 + 弹窗查看                  | [README](./XnLongText/README.md)        |
| XnModal           | 可拖拽、限高的 Ant Design Modal        | [README](./XnModal/README.md)           |
| XnNoticeInbox     | 消息中心抽屉                           | [README](./XnNoticeInbox/README.md)     |
| XnOrgSelect       | 单位 / 用户 / 角色 / 岗位              | [README](./XnOrgSelect/README.md)       |
| XnPageLayout      | 列表页骨架                             | [README](./XnPageLayout/README.md)      |
| XnPopconfirm      | 行内确认气泡                           | [README](./XnPopconfirm/README.md)      |
| XnRegion          | 省市区级联                             | [README](./XnRegion/README.md)          |
| XnRichEditor      | 富文本（wangEditor）                   | [README](./XnRichEditor/README.md)      |
| XnSearch          | 配置化搜索表单                         | [README](./XnSearch/README.md)          |
| XnSidebarMenu     | 多级菜单                               | [README](./XnSidebarMenu/README.md)     |
| XnSmsCode         | 短信验证码倒计时                       | [README](./XnSmsCode/README.md)         |
| XnTable           | 配置化表格                             | [README](./XnTable/README.md)           |
| XnTagsView        | 页面标签栏                             | [README](./XnTagsView/README.md)        |
| XnThemePicker     | 主题设置                               | [README](./XnThemePicker/README.md)     |
| XnTreePanel       | 左侧树面板                             | [README](./XnTreePanel/README.md)       |
| XnUiPreferenceFab | 个人界面偏好 FAB                       | [README](./XnUiPreferenceFab/README.md) |
| XnUpload          | 大文件分片上传                         | [README](./XnUpload/README.md)          |
| XnWatermark       | 页面水印                               | [README](./XnWatermark/README.md)       |
