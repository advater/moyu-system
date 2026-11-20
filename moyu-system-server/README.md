# moyu-system-server

[moyu-system](https://github.com/advater/moyu-system) 的 **管理系统底座服务**。NestJS + Fastify + Prisma + MySQL + Redis。

提供登录、RBAC、多租户、字典、OAuth2、邮件/短信、站内信、文件与审计等基础能力。管理端页面在 [moyu-system-react](../moyu-system-react/README.md)。

API 前缀：`/admin/*`（健康检查：`/health`）。

---

## 业务说明

| 域 | 能力 |
|----|------|
| 认证 | 账密 / 验证码 / 刷新令牌 / 密码过期 |
| 租户 | 租户、套餐、账号配额；Token 带 `tenantId` |
| 组织 | 用户、资料、部门、岗位、角色、菜单、数据权限 |
| 通知 | 站内信模版与发送 |
| 通道 | 邮件、短信、社交登录、OAuth2 |
| 运维 | 字典、参数、定时任务、操作/登录/API 日志、文件 |

---

## 目录架构

```txt
moyu-system-server/
├── prisma/                 # 系统表（默认库 moyu_cloud_db）
├── src/
│   ├── modules/            # auth / tenant / user / permission / notify / mail / sms / file / logger …
│   ├── common/             # 守卫、租户隔离、拦截器
│   ├── database/           # Prisma
│   ├── plugins/            # Redis 等
│   ├── app.module.ts
│   └── main.ts
├── config.yaml             # 端口等非密钥配置（默认 3000）
├── .env.example
├── .env.development
├── .env.test
├── .env.production
└── package.json
```

---

## 业务流转

```text
管理端
    │  Bearer + tenant-id
    ▼
POST /admin/auth/login  ──►  校验验证码、租户状态、密码
    │
    ├─► accessToken / refreshToken
    └─► 菜单与权限码

后续请求 ──► JwtGuard → TenantGuard → Permission
写操作可 @OperateLog 落库
```

---

## 快速开始

```bash
npm install
# 在 .env.development 或 .env.development.local 中填写
# DATABASE_URL / JWT_SECRET / SESSION_SECRET
npx prisma generate
npx prisma migrate dev        # 空库；已有库见下方注意事项
npm run start:dev
```

- 服务：<http://localhost:3000>
- Swagger（非生产）：<http://localhost:3000/api-docs>

Redis **必须可用**，连不上会拒绝启动。

---

## 脚本与配置

| 命令 | `NODE_ENV` | 配置文件 |
|------|------------|----------|
| `npm run start:dev` | development | `.env.development` |
| `npm run start:test` | test | `.env.test` |
| `npm run start:prod` | production | `.env.production` |
| `npm run build` | — | — |
| `npm test` / `npm run test:e2e` | — | — |

加载顺序（后者不覆盖已有值）：`.env.{环境}.local` → `.env.{环境}` → `.env.local` → `.env`。密钥请写在 `*.local` 或本地 `.env` 中，不要提交。

---

## 端口说明

| 用途 | 地址 |
|------|------|
| HTTP | `:3000`（`config.yaml` `app.port`） |
| MySQL | `:3306` / `moyu_cloud_db` |
| Redis | `:6379` |
| 管理前端 | `moyu-system-react` 默认 `:5173` |

---

## 注意事项

- Authorization：`Bearer <accessToken>`。刷新令牌走 `POST /admin/auth/refresh-token` **Body**，禁止 Query。
- 账密登录先 `GET /admin/captcha/get`；可用 `AUTH_CAPTCHA_ENABLED=false` 关闭（仅开发）。
- 超管角色编码 `super_admin` 跳过权限码。开放注册默认关：`AUTH_REGISTER_ENABLED=true` 才开。
- 非空旧库首次 Migrate：先 `npx prisma migrate resolve --applied 20260906000000_init_system`，再 `migrate deploy`。
- 生产须配 `cors.origins`、足够长的 JWT/Session 密钥；短信回调要 `SMS_CALLBACK_SECRET`。
