# xn-admin-react-ts

心念后台管理系统前端：React 19 + TypeScript + Vite + Ant Design。

本仓库**独立开源**。对接微服务后端独立仓库 **xn-admin-cloud**（经网关 `8088`），提供 JWT 登录、RBAC、动态路由/菜单、page-ui 驱动 CRUD、主题、通知与系统监控等能力。

本工程是基准前端 **xn-admin-vue3-ts** 的 React 技术栈移植。同步进度见 [`SYNC.md`](./SYNC.md)。

**视觉刻意与 Element Plus 端区分**：使用 Ant Design 原生主色（`#1677ff`）、浅色侧栏与白顶栏（主题可切换），不做「壳层仿 Element」。业务能力以基准为准。

版本：`1.0.0` · 许可证：[Apache-2.0](./LICENSE) · Copyright 2026 心念

## 相关仓库

| 仓库                                    | 说明                           |
| --------------------------------------- | ------------------------------ |
| `xn-admin-cloud`                        | 微服务后端（必需）             |
| `xn-admin-vue3-ts`                      | 功能基准（Vue 3 + TypeScript） |
| `xn-admin-vue3-js` / `xn-admin-vue2-js` | 其它 Vue 管理端                |

## 前提

1. Node.js 20+（建议 20 LTS）
2. 后端 **xn-admin-cloud** 已启动，网关可访问：http://127.0.0.1:8088  
   （按其仓库 README 启动 system / file / log / job / gateway）
3. MySQL / Redis / Nacos / MinIO 等中间件已就绪（随后端）

## 默认账号

与后端种子账号一致（首次初始化，**仅用于本地开发**）：

| 用户名       | 初始密码     | 说明       |
| ------------ | ------------ | ---------- |
| `SuperAdmin` | `SuperAdmin` | 超级管理员 |
| `admin`      | `admin`      | 管理员     |

登录后请尽快修改密码。详见 [SECURITY.md](./SECURITY.md)。

## 快速启动

```bash
npm install           # 安装依赖
npm run dev           # 启动开发服务
```

开发地址：http://localhost:1800（与 vue2-js `1801` / vue3-js `1802` / vue3-ts `1803` 错开，便于同时联调）

Vite 已代理到网关：

| 前缀           | 目标                                 |
| -------------- | ------------------------------------ |
| `/api`         | `http://localhost:8088`              |
| `/uploads`     | `http://localhost:8088`              |
| `/ws`          | `http://localhost:8088`（WebSocket） |
| `/swagger-ui`  | `http://localhost:8088`              |
| `/v3/api-docs` | `http://localhost:8088`              |

```bash
npm run build         # tsc -b + vite 生产构建
npm run preview       # 本地预览构建产物
npm run typecheck     # TypeScript：仅做类型检查
npm run lint          # oxlint：代码检查
npm run lint:fix      # oxlint：自动修复可修复项
npm run format        # Prettier：格式化代码
npm run format:check  # Prettier：仅检查格式，不改文件
```

生产静态资源需由 Nginx 等反向代理到同一网关（`/api`、`/uploads`、`/ws`），或自行调整构建时的代理/网关地址。

## 质量检查

```bash
npm run typecheck     # TypeScript 类型检查
npm run lint          # oxlint
npm run format:check  # Prettier 格式检查
npm run ci            # 全量检查：typecheck + lint + format:check + build
```

提交前会经 Husky 跑 lint-staged（oxlint 修复 + Prettier 格式化）；提交信息需符合 [Conventional Commits](https://www.conventionalcommits.org/)（如 `feat: xxx`）。约定详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

在 Cursor / VS Code 中打开本仓库并安装推荐扩展后：**保存文件会自动 Prettier 格式化，并执行 oxlint 可自动修复项**（见 `.vscode/settings.json`）。

## 技术栈

| 类别          | 技术                                             |
| ------------- | ------------------------------------------------ |
| 框架          | React 19、TypeScript 6、Vite 8                   |
| UI            | Ant Design 6、@ant-design/icons、Iconify         |
| 状态 / 路由   | Zustand 5、React Router 7                        |
| 请求          | Axios                                            |
| 图表 / 编辑器 | ECharts、wangEditor                              |
| Excel         | ExcelJS、xlsx                                    |
| 工程化        | oxlint、Prettier、Husky、lint-staged、commitlint |

## 与基准差异

| 项              | 基准 Vue（xn-admin-vue3-ts） | 本工程 React                                  |
| --------------- | ---------------------------- | --------------------------------------------- |
| UI              | Element Plus                 | **Ant Design 原生视觉**                       |
| 默认主色 / 侧栏 | `#409eff` 同色顶栏侧栏       | `#1677ff` + 浅色侧栏 + 白顶栏（可切换）       |
| 菜单图标字段    | `icon`（Element）            | 优先 `iconAntd`，回退 `icon`                  |
| 状态            | Pinia                        | Zustand                                       |
| 路由            | vue-router `addRoute`        | 动态 `RouteObject` 挂载                       |
| 视图目录        | `src/views`                  | `src/pages`                                   |
| 权限            | `v-permission`               | `<Auth>` / `usePermission`                    |
| `APP_CLIENT_ID` | `xn-admin-vue3-ts`           | `xn-admin-react-ts`（`src/config/client.ts`） |
| 开发端口        | `1803`                       | `1800`                                        |

## 目录结构

```
src/
├── api/            # 接口模块（auth、user、role、route、notice、logs…）
├── components/     # 通用组件（Xn* / Auth / ThemePicker…）
├── config/         # 应用 / 客户端 / 主题等配置
├── hooks/          # usePageUi、usePermission 等
├── layouts/        # AdminLayout 及 Side / Top / Mix / Columns
├── pages/          # 业务页面（由 view-loader 懒加载）
├── router/         # 静态路由 + 动态注册与守卫
├── stores/         # Zustand：user、permission、menu、tagsView、theme、notice
├── styles/         # 全局样式
├── types/          # 类型定义
└── utils/          # request、icons、excel、download、view-loader…
```

## 通用组件

列表页常用组合：

```
XnPageLayout
├── aside → XnTreePanel（可选）
├── search → XnSearch
├── toolbar → XnButton
└── table → XnTable
```

每个组件目录下有独立文档，入口见 [`src/components/README.md`](./src/components/README.md)。

| 组件              | 说明                                     |
| ----------------- | ---------------------------------------- |
| XnAppIcon         | 统一图标（Ant Design / Iconify / SVG）   |
| XnAppBrandLogo    | 品牌 Logo                                |
| XnAuth            | 按钮级权限（对应 Vue 端 `v-permission`） |
| XnButton          | 工具栏 / 行操作按钮                      |
| XnErrorPage       | 403 / 404 / 503 错误页                   |
| XnIconPicker      | 图标选择器                               |
| XnImport          | Excel 导入对话框                         |
| XnLongText        | 长文本截断 + 点击弹窗查看                |
| XnModal           | 可拖拽、限高的 Modal                     |
| XnNoticeInbox     | 消息中心抽屉                             |
| XnPageLayout      | 列表页骨架                               |
| XnRichEditor      | 富文本编辑器（wangEditor）               |
| XnSearch          | 配置化搜索表单                           |
| XnSidebarMenu     | 多级菜单                                 |
| XnTable           | 配置化表格                               |
| XnTagsView        | 页面标签栏                               |
| XnThemePicker     | 主题设置                                 |
| XnTreePanel       | 左侧树面板                               |
| XnUiPreferenceFab | 个人界面偏好 FAB                         |
| XnUpload          | 大文件分片上传                           |

配置通常来自后端 page-ui 与路由权限。

## 界面预览

截图目录 [`docs/images/`](./docs/images/)，命名与基准仓库 **xn-admin-vue3-ts** 对齐（如 `login.png`、`users.png`），均为本工程 Ant Design 界面实拍。

### 登录与首页

| 模块   | 截图                                 |
| ------ | ------------------------------------ |
| 登录页 | ![登录页](./docs/images/login.png)   |
| 首页   | ![首页](./docs/images/dashboard.png) |

### 个人中心

| 模块     | 截图                                         |
| -------- | -------------------------------------------- |
| 个人信息 | ![个人信息](./docs/images/profile.png)       |
| 我的消息 | ![我的消息](./docs/images/messages-mine.png) |

### 系统监控

| 模块     | 截图                                          |
| -------- | --------------------------------------------- |
| 在线用户 | ![在线用户](./docs/images/monitor-online.png) |
| 服务监控 | ![服务监控](./docs/images/monitor-server.png) |
| 缓存监控 | ![缓存监控](./docs/images/monitor-redis.png)  |
| SQL 监控 | ![SQL 监控](./docs/images/monitor-sql.png)    |

### 日志管理

后端 `xn-log` / `xn-job` 已提供登录 / 操作 / 异常 / 任务日志接口（查询、详情、删除、清空、导出），菜单与 page-ui 已种子。本仓库**尚未落地页面**（`view-loader` 会落到 404）：

| 页面     | 路由                     | 前端现状                                     |
| -------- | ------------------------ | -------------------------------------------- |
| 登录日志 | `/system/logs/login`     | 有 `api/login-log`，无 `pages/.../index.tsx` |
| 操作日志 | `/system/logs/oper`      | 有 `api/oper-log`，无页面                    |
| 异常日志 | `/system/logs/exception` | 有 `api/exception-log`，无页面               |
| 任务日志 | `/system/jobs/logs`      | 定时任务页会跳转至此，无页面                 |

### 组织与账号

| 模块     | 截图                                 |
| -------- | ------------------------------------ |
| 用户管理 | ![用户管理](./docs/images/users.png) |
| 单位管理 | ![单位管理](./docs/images/units.png) |
| 岗位管理 | ![岗位管理](./docs/images/posts.png) |

### 权限与安全

| 模块     | 截图                                               |
| -------- | -------------------------------------------------- |
| 角色列表 | ![角色列表](./docs/images/roles.png)               |
| 角色权限 | ![角色权限](./docs/images/permissions.png)         |
| 权限内容 | ![权限内容](./docs/images/permissions-content.png) |
| 路由管理 | ![路由管理](./docs/images/routes.png)              |

### 内容运营

| 模块     | 截图                                   |
| -------- | -------------------------------------- |
| 公告管理 | ![公告管理](./docs/images/notices.png) |
| 站内信   | ![站内信](./docs/images/messages.png)  |

### 基础数据与系统设置

| 模块       | 截图                                            |
| ---------- | ----------------------------------------------- |
| 字典管理   | ![字典管理](./docs/images/dicts.png)            |
| 登录页设置 | ![登录页设置](./docs/images/login-settings.png) |
| 系统配置   | ![系统配置](./docs/images/config.png)           |
| 安全策略   | ![安全策略](./docs/images/security.png)         |
| 远程连接   | ![远程连接](./docs/images/remote-storage.png)   |
| 联系与捐赠 | ![联系与捐赠](./docs/images/site-contact.png)   |

### 系统工具

| 模块     | 截图                                    |
| -------- | --------------------------------------- |
| 文件管理 | ![文件管理](./docs/images/files.png)    |
| 定时任务 | ![定时任务](./docs/images/jobs.png)     |
| 回收站   | ![回收站](./docs/images/recycle.png)    |
| 代码生成 | ![代码生成](./docs/images/codegen.png)  |
| 接口文档 | ![接口文档](./docs/images/api-docs.png) |

## 功能概览

- JWT 登录与会话刷新；`<Auth>` / `usePermission` 按钮级权限
- 动态菜单 / 路由注册（后端路由 + `pages` 懒加载）
- 角色、权限、用户、单位、岗位、字典、公告、站内信、登录页配置、系统配置、安全策略、远程连接、联系与捐赠
- 页面标签栏、多布局模式、主题（含自定义色与背景）
- 通用系统配置 + 登录用户个人布局/字号（右下角悬浮入口）
- 表格列个性化、Excel 导入导出
- 系统监控：在线用户 / 服务 / Redis / SQL
- 文件管理、定时任务、回收站、代码生成、接口文档页（Swagger UI / API 切换）
- 公告 WebSocket 推送（`/ws`）
- 日志页面前端待补：登录 / 操作 / 异常 / 任务日志（后端接口与菜单已齐）

## 环境与约定

- 路径别名：`@` → `src/`
- `APP_CLIENT_ID = xn-admin-react-ts`（`src/config/client.ts`），公开系统配置按 client 隔离品牌文案
- 鉴权 Token 由 `utils/request` 注入；未登录跳转登录页
- 列表页模式：`XnPageLayout` → `XnSearch` → `XnButton` → `XnTable`（+ 可选 `XnTreePanel`）
- 动态菜单页面对应 `src/pages/**/index.tsx`（由 view-loader 懒加载）
- 详细同步与缺口说明见 [`SYNC.md`](./SYNC.md)

## 生产部署（摘要）

- `npm run build` 产出静态资源，由 Nginx 等托管
- 将 `/api`、`/uploads`、`/ws` 反向代理到后端网关（默认 `127.0.0.1:8088`）
- 安全见 [SECURITY.md](./SECURITY.md)；贡献见 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 支持捐赠

如果这个项目对你有帮助，欢迎请作者喝杯咖啡 ☕

<p align="center">
  <img src="./docs/donation/donate.png" alt="支持捐赠（微信支付 / 支付宝）" width="480" />
</p>

## 许可证

[Apache License 2.0](./LICENSE)
