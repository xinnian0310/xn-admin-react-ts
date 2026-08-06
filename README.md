# xn-admin-react-ts

心念后台管理系统前端：React 19 + TypeScript + Vite + Ant Design。

对接微服务后端 [`xn-admin-cloud`](../xn-admin-cloud/)（经网关 `8088`），提供 JWT 登录、RBAC、动态路由/菜单、page-ui 驱动 CRUD、主题、通知与系统监控等能力。

本工程是基准前端 [`xn-admin-vue3-ts`](../xn-admin-vue3-ts/) 的 React 技术栈移植，功能目标见 [`docs/PRD-xn-admin-frontend-sync.md`](../docs/PRD-xn-admin-frontend-sync.md)。

**视觉刻意与 Element Plus 端区分**：使用 Ant Design 原生主色（`#1677ff`）、Pro 深色侧栏与白顶栏，不做「壳层仿 Element」。业务能力以基准为准。

版本：`1.0.0` · Copyright 2026 心念

## 前提

1. Node.js 20+
2. 后端已启动，网关可访问：http://127.0.0.1:8088
3. MySQL / Redis / Nacos 等中间件已就绪

## 默认账号

| 用户名       | 初始密码     | 说明       |
| ------------ | ------------ | ---------- |
| `SuperAdmin` | `SuperAdmin` | 超级管理员 |
| `admin`      | `admin`      | 管理员     |

## 快速启动

```bash
npm install
npm run dev
```

开发地址：http://localhost:8888

| 前缀          | 目标                                 |
| ------------- | ------------------------------------ |
| `/api`        | `http://localhost:8088`              |
| `/uploads`    | `http://localhost:8088`              |
| `/swagger-ui` | `http://localhost:8088`              |
| `/v3/api-docs`| `http://localhost:8088`              |
| `/ws`         | `http://localhost:8088`（WebSocket） |

```bash
npm run build        # tsc -b + vite build
npm run preview
npm run typecheck
npm run lint
npm run format
```

## 技术栈

| 类别        | 技术                                      |
| ----------- | ----------------------------------------- |
| 框架        | React 19、TypeScript、Vite 8              |
| UI          | Ant Design 6、@ant-design/icons、Iconify  |
| 状态 / 路由 | Zustand 5、React Router 7                 |
| 请求        | Axios                                     |
| 图表 / 编辑 | ECharts、wangEditor                       |
| Excel       | ExcelJS、xlsx                             |

## 工程约定

- `APP_CLIENT_ID = xn-admin-react-ts`（`src/config/client.ts`），公开系统配置按 client 隔离品牌文案
- 列表页模式：`XnPageLayout` → `XnSearch` → `XnButton` → `XnTable`（+ 可选 `XnTreePanel`）
- 动态菜单页面对应 `src/pages/**/index.tsx`（由 `view-loader` 懒加载）

## 同步状态

详见同目录 [`SYNC.md`](./SYNC.md)。
