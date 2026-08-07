# xn-admin-react-ts 同步说明

对照基准：独立仓库 **xn-admin-vue3-ts**（功能范围以其仓库为准）

## 已实现

### M0–M2 基础

- Vite / TS / Ant Design / Zustand / React Router（端口 **1800**，`APP_CLIENT_ID=xn-admin-react-ts`）
- 请求层、会话守卫、公告 WS、动态路由、四布局、核心 Xn* 组件
- Login / Dashboard（统计卡片 + 注册趋势/角色分布图）/ Profile / 错误页 / Redirect
- Vite 代理含 `/api` `/uploads` `/ws` `/swagger-ui` `/v3/api-docs` → `localhost:8088`

### M3 组织与权限

| 页面                                                  | 状态                                                    |
| ----------------------------------------------------- | ------------------------------------------------------- |
| `users`                                               | 完整：列表 + 单位树 + 保存弹窗 + 导入 + 导出 + 状态开关 |
| `system/units`                                        | 完整：树表 + 保存 + 分配角色 + 添加子级                 |
| `system/posts`                                        | 完整：列表 + 保存 + 导入 + 导出                         |
| `system/roles`                                        | 完整：列表 + 保存 + 状态开关 + 跳转分配权限             |
| `system/permissions`                                  | 完整：角色权限分配三栏                                  |
| `system/permissions/save` · `assign` · `assign-panel` | 已移植                                                  |
| `system/permissions-content`                          | 完整：菜单树 + 类型 Tab + CRUD                          |
| `system/routes`                                       | 完整：树表 + 保存 + 代码生成                            |
| `XnImport` / `IconPicker`                             | 已落地                                                  |

### M4 运营与配置

| 页面                    | 状态                                            |
| ----------------------- | ----------------------------------------------- |
| `system/dicts` + `data` | 完整：类型/数据 CRUD                            |
| `system/notices`        | 完整：下发/撤回/已读 + 富文本                   |
| `system/messages`       | 完整：发送 + 富文本                             |
| `messages/mine`         | 完整：未读/详情标已读                           |
| `system/login-settings` | 完整：配置 + 验证码类型                         |
| `system/config`         | 完整：品牌只写 `app.clients[xn-admin-react-ts]` |
| `system/security`       | 完整：策略 + 解锁                               |
| `system/site-contact`   | 完整：联系/收款码子页                           |
| `XnRichEditor`          | wangEditor React                                |

### M5 工具与监控

| 页面                                          | 状态                                                              |
| --------------------------------------------- | ----------------------------------------------------------------- |
| `system/files`                                | 完整：目录树 + 上传 + 删除/预览                                   |
| `system/jobs` + `logs`                        | 完整：CRUD/执行/日志导出                                          |
| `system/recycle`                              | 完整：恢复 / 彻底删除                                             |
| `system/codegen`                              | 完整：表列表 + 向导 + ZIP                                         |
| `system/api-docs`                             | 完整：工具栏 **UI / API** 切换；无刷新；Swagger iframe + 登记列表 |
| `monitor/online` · `server` · `redis` · `sql` | 完整                                                              |
| `system/logs/login` · `oper` · `exception`    | 完整：详情/清空/导出                                              |

## 有意栈差异

| 项                        | 基准 Vue               | 本工程 React                                 |
| ------------------------- | ---------------------- | -------------------------------------------- |
| UI                        | Element Plus           | **Ant Design 原生视觉**（不仿 Element 壳层） |
| 默认主色 / 侧栏           | `#409eff` 同色顶栏侧栏 | `#1677ff` + Pro 深色侧栏 `#001529` + 白顶栏  |
| 菜单图标字段              | `icon`（Element）      | 优先 `iconAntd`，回退 `icon`                 |
| 状态                      | Pinia                  | Zustand                                      |
| 路由                      | vue-router `addRoute`  | 动态 `RouteObject` 挂载                      |
| 视图目录                  | `src/views`            | `src/pages`                                  |
| 权限                      | `v-permission`         | `<Auth>` / `usePermission`                   |
| 后端字段 `ui.elementPlus` | 驱动 EP                | 保留以兼容 API；实际用 ConfigProvider        |

## 剩余缺口（建议人工对照）

- Dashboard：基准还有技术选型 / Git 更新日志 / 站点联系区，React 端尚未完全对齐
- 表格列设置完整 UI、Keep-alive 等价缓存
- 第 6 章逐页与基准点对点浏览器验收（同账号交叉操作）
- api-docs UI 模式依赖网关转发 `/swagger-ui/**`、`/v3/api-docs/**` → xn-system

## 验收建议

1. 启动 `xn-admin-cloud` 网关 `8088`
2. `npm run dev` → http://localhost:1800
3. SuperAdmin 登录 → 动态菜单 → 用户管理 / 系统配置 / api-docs UI·API / 监控 / 日志导出
4. `npm run typecheck` / `npm run build`
