# 贡献指南

感谢关注本仓库。本工程为独立开源前端（React + TypeScript + Ant Design）；功能对齐基准仓库 **xn-admin-vue3-ts**，配套后端为 **xn-admin-cloud**。同步进度见 [SYNC.md](./SYNC.md)。

## 如何贡献

1. Fork 本仓库并创建功能分支
2. 本地按下方命令完成检查
3. 提交信息建议遵循 Conventional Commits
4. 发起 Pull Request，说明动机与验证方式

安全相关问题请优先阅读 [SECURITY.md](./SECURITY.md)。

## 本地命令

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
```

- `typecheck`：TypeScript 类型检查
- `lint`：oxlint
- `format:check`：Prettier 仅检查
- `build`：类型检查 + 生产构建

## 提交信息

```
<type>(optional-scope): <subject>

feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert
```

示例：`feat(logs): 增加操作日志详情弹窗`
