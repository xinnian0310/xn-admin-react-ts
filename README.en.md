<p align="center">
  <img src="./docs/preview-login.gif" alt="Login to dashboard" width="880" />
</p>

# xn-admin-react-ts

[English](README.en.md) | [简体中文](README.md)

XinNian Admin frontend: React 19 + TypeScript + Vite + Ant Design.

Ported from the Vue baseline **xn-admin-vue3-ts**, talking to the same backend **xn-admin-cloud**. Business features match the Vue apps (auth, dynamic menus, RBAC, CRUD, layouts, AI chat, monitoring, files, jobs). Visuals use native Ant Design, not an Element look-alike. Apache License 2.0 — **free for personal and commercial use**.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-Free-success.svg)](./LICENSE)
[![Commercial](https://img.shields.io/badge/Commercial-Allowed-brightgreen.svg)](./LICENSE)
[![Personal](https://img.shields.io/badge/Personal-Allowed-brightgreen.svg)](./LICENSE)

Sync status: [`SYNC.md`](./SYNC.md).

Version: `1.1.0` · License: [Apache-2.0](./LICENSE) · Copyright 2026 XinNian

**Live demo:** https://react.xinniankeji.vip · Website: https://xinniankeji.vip

## Related repositories

| Repository          | Live                                    | Gitee                                                | GitHub                                                     | Notes                                 |
| ------------------- | --------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------- |
| `xn-admin-cloud`    | [Site](https://xinniankeji.vip)         | [Gitee](https://gitee.com/jenning/xn-admin-cloud)    | [GitHub](https://github.com/xinnian0310/xn-admin-cloud)    | Backend (required)                    |
| `xn-admin-vue3-ts`  | [Demo](https://vue3-ts.xinniankeji.vip) | [Gitee](https://gitee.com/jenning/xn-admin-vue3-ts)  | [GitHub](https://github.com/xinnian0310/xn-admin-vue3-ts)  | Feature baseline (Vue 3 + TypeScript) |
| `xn-admin-vue3-js`  | [Demo](https://vue3-js.xinniankeji.vip) | [Gitee](https://gitee.com/jenning/xn-admin-vue3-js)  | [GitHub](https://github.com/xinnian0310/xn-admin-vue3-js)  | Vue 3 + JavaScript (Composition)      |
| `xn-admin-vue2-js`  | [Demo](https://vue2.xinniankeji.vip)    | [Gitee](https://gitee.com/jenning/xn-admin-vue2-js)  | [GitHub](https://github.com/xinnian0310/xn-admin-vue2-js)  | Vue 3 + JavaScript (Options API)      |
| `xn-admin-react-ts` | [Demo](https://react.xinniankeji.vip)   | [Gitee](https://gitee.com/jenning/xn-admin-react-ts) | [GitHub](https://github.com/xinnian0310/xn-admin-react-ts) | This repo                             |

## Prerequisites

1. Node.js 20+ (20 LTS recommended)
2. Backend **xn-admin-cloud** running, gateway at http://127.0.0.1:8088  
   (three-step start in that repo: `docker compose up -d` then `scripts/run-dev`)
3. Middleware can come from the backend Docker Compose (or your own MySQL / Redis / Nacos / MinIO)

## Default accounts

| Username     | Initial password | Notes       |
| ------------ | ---------------- | ----------- |
| `SuperAdmin` | `xinnian`        | Super admin |
| `admin`      | `admin`          | Admin       |

Local development only. Change passwords after login. See [SECURITY.md](./SECURITY.md).

## Quick start

```bash
npm install
npm run dev
```

Dev URL: http://localhost:1800

Vite proxies `/api`, `/uploads`, `/ws`, `/swagger-ui`, `/v3/api-docs` to `http://localhost:8088`.

```bash
npm run build         # tsc -b + vite
npm run preview
npm run typecheck
npm run lint
npm run lint:fix
npm run format
npm run ci            # typecheck + lint + format:check + build
```

## vs Vue baseline

| Item             | Vue (`xn-admin-vue3-ts`)        | This repo                              |
| ---------------- | ------------------------------- | -------------------------------------- |
| UI               | Element Plus                    | **Native Ant Design**                  |
| Primary / chrome | `#409eff` matching header/sider | `#1677ff` + light sider + white header |
| Menu icon field  | `icon` (Element)                | Prefer `iconAntd`, fall back to `icon` |
| State            | Pinia                           | Zustand                                |
| Router           | vue-router `addRoute`           | Dynamic `RouteObject`                  |
| Views            | `src/views`                     | `src/pages`                            |
| Permission       | `v-permission`                  | `<Auth>` / `usePermission`             |
| `APP_CLIENT_ID`  | `xn-admin-vue3-ts`              | `xn-admin-react-ts`                    |
| Dev port         | `1803`                          | `1800`                                 |

## Stack

React 19, TypeScript 6, Vite 8, Ant Design 6, Zustand 5, React Router 7, Axios, ECharts, wangEditor, ExcelJS, oxlint, Prettier, Husky.

## Layout

```
src/
├── api/
├── components/
├── config/
├── hooks/
├── layouts/
├── pages/
├── router/
├── stores/
├── styles/
├── types/
└── utils/
```

Typical list page: `XnPageLayout` → `XnSearch` → `XnButton` + `XnExport` → `XnTable` (+ optional `XnTreePanel`).

Full catalog (including `XnDialog` / `XnModal`, captcha, SMS, dict/org/region, image upload, watermark, Cron): [`src/components/README.md`](./src/components/README.md).

## Screenshots

Ant Design captures in [`docs/images/`](./docs/images/), same filenames as the Vue baseline.

### Login and dashboard

| Page      | Screenshot                                |
| --------- | ----------------------------------------- |
| Login     | ![Login](./docs/images/login.png)         |
| Dashboard | ![Dashboard](./docs/images/dashboard.png) |

### AI chat

| Page      | Screenshot                                   |
| --------- | -------------------------------------------- |
| Chat      | ![AI chat](./docs/images/ai-chat.png)        |
| Providers | ![Providers](./docs/images/ai-providers.png) |
| Models    | ![Models](./docs/images/ai-models.png)       |
| Quota     | ![Quota](./docs/images/ai-quota.png)         |

### Profile

| Page        | Screenshot                                      |
| ----------- | ----------------------------------------------- |
| Profile     | ![Profile](./docs/images/profile.png)           |
| My messages | ![My messages](./docs/images/messages-mine.png) |

### Monitoring

| Page         | Screenshot                                        |
| ------------ | ------------------------------------------------- |
| Online users | ![Online users](./docs/images/monitor-online.png) |
| Server       | ![Server](./docs/images/monitor-server.png)       |
| Redis        | ![Redis](./docs/images/monitor-redis.png)         |
| SQL          | ![SQL](./docs/images/monitor-sql.png)             |

### Logs

| Page           | Screenshot                                          |
| -------------- | --------------------------------------------------- |
| Login logs     | ![Login logs](./docs/images/logs-login.png)         |
| Operation logs | ![Operation logs](./docs/images/logs-oper.png)      |
| Exception logs | ![Exception logs](./docs/images/logs-exception.png) |
| Job logs       | ![Job logs](./docs/images/jobs-log.png)             |

### Organization

| Page  | Screenshot                        |
| ----- | --------------------------------- |
| Users | ![Users](./docs/images/users.png) |
| Units | ![Units](./docs/images/units.png) |
| Posts | ![Posts](./docs/images/posts.png) |

### Permissions

| Page               | Screenshot                                                   |
| ------------------ | ------------------------------------------------------------ |
| Roles              | ![Roles](./docs/images/roles.png)                            |
| Role permissions   | ![Role permissions](./docs/images/permissions.png)           |
| Permission catalog | ![Permission catalog](./docs/images/permissions-content.png) |
| Routes             | ![Routes](./docs/images/routes.png)                          |

### Content and settings

| Page               | Screenshot                                               |
| ------------------ | -------------------------------------------------------- |
| Notices            | ![Notices](./docs/images/notices.png)                    |
| Inbox              | ![Inbox](./docs/images/messages.png)                     |
| Dictionaries       | ![Dictionaries](./docs/images/dicts.png)                 |
| Login page         | ![Login page settings](./docs/images/login-settings.png) |
| System config      | ![System config](./docs/images/config.png)               |
| Security           | ![Security](./docs/images/security.png)                  |
| Remote storage     | ![Remote storage](./docs/images/remote-storage.png)      |
| Contact & donation | ![Contact](./docs/images/site-contact.png)               |

### Tools

| Page        | Screenshot                              |
| ----------- | --------------------------------------- |
| Files       | ![Files](./docs/images/files.png)       |
| Jobs        | ![Jobs](./docs/images/jobs.png)         |
| Recycle bin | ![Recycle](./docs/images/recycle.png)   |
| Codegen     | ![Codegen](./docs/images/codegen.png)   |
| API docs    | ![API docs](./docs/images/api-docs.png) |

## Production (summary)

- `npm run build`, then Nginx
- Reverse-proxy `/api`, `/uploads`, `/ws` to gateway `127.0.0.1:8088`
- [SECURITY.md](./SECURITY.md) · [CONTRIBUTING.md](./CONTRIBUTING.md)

## Support

If this project helps you, a coffee is welcome ☕

<p align="center">
  <img src="./docs/donation/donate.png" alt="Donate (WeChat Pay / Alipay)" width="480" />
</p>

## License

[Apache License 2.0](./LICENSE). Personal, commercial, closed-source, and redistribution are allowed if you keep copyright, license, and NOTICE, and mark modified files. Software is provided “as is”, without warranty.

Donations are voluntary and are not a commercial license or paid support.
