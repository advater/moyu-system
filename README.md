# moyu-system

平台 **管理系统底座**：提供登录与账号、多租户、RBAC、字典、通知通道、文件与审计等基础能力，供管理端使用。

仓库地址：<https://github.com/advater/moyu-system>

- 前端：[moyu-system-react](./moyu-system-react)（Vite + React + TypeScript + Ant Design）
- 后端：[moyu-system-server](./moyu-system-server)（NestJS + Fastify + Prisma + MySQL + Redis）

---

## 功能

| 域 | 能力 |
|----|------|
| 认证 | 账密 / 验证码 / 刷新令牌 / 密码过期 |
| 租户 | 租户、套餐、账号配额；Token 带 `tenantId` |
| 组织 | 用户、资料、部门、岗位、角色、菜单、数据权限 |
| 通知 | 站内信模版与发送 |
| 通道 | 邮件、短信、社交登录、OAuth2 |
| 运维 | 字典、参数、定时任务、操作/登录/API 日志、文件 |

管理端权限码与后端 `@Permission('system:xxx:yyy')` 对齐，菜单由登录接口下发。

---

## 仓库结构

```text
moyu-system/
├── moyu-system-react/          # 管理前端（默认 :5173）
│   ├── .env.example            # 环境变量说明
│   ├── .env.development        # 本地开发
│   ├── .env.test               # 测试构建
│   └── .env.production         # 生产构建
└── moyu-system-server/         # 系统服务（默认 :3000）
    ├── .env.example
    ├── .env.development
    ├── .env.test
    ├── .env.production
    ├── prisma/                 # 系统表（默认库 moyu_cloud_db）
    ├── src/
    ├── config.yaml             # 端口等非密钥配置
    └── package.json
```

更细的说明见各子目录 README。前后端环境文件与 `package.json` 脚本按 `development` / `test` / `production` 一一对应。

---

## 本地启动

先准备好 **MySQL** 和 **Redis**。Redis 不可用时，后端会拒绝启动。默认数据库名为 `moyu_cloud_db`。

### 1. 启动后端

```bash
cd moyu-system-server
npm install
cp .env.development .env.development.local   # 可选：在 local 文件或本地 .env 里填写真实密钥，不要提交
# 至少填写 DATABASE_URL、JWT_SECRET、SESSION_SECRET（不要写入已入库的 .env.development；生产环境密钥长度须 ≥ 32）
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

- 服务：<http://localhost:3000>
- 健康检查：<http://localhost:3000/health>
- Swagger（非生产环境）：<http://localhost:3000/api-docs>

已有非空旧库时，不要直接 `migrate dev`。先执行 `npx prisma migrate resolve --applied 20260906000000_init_system`，再 `npx prisma migrate deploy`。

### 2. 启动前端

```bash
cd moyu-system-react
npm install
npm run dev
```

浏览器打开 <http://localhost:5173>。开发时前端把 `/admin` 代理到 `http://localhost:3000`。

本机覆盖项（如预填登录信息）请写在 `.env.development.local`，不要提交。

---

## 端口

| 用途 | 地址 |
|------|------|
| 管理前端 | `:5173`（可用环境变量 `VITE_PORT` 修改） |
| 系统服务 | `:3000`（`config.yaml` 中 `app.port`） |
| MySQL | `:3306` / `moyu_cloud_db` |
| Redis | `:6379` |

---

## 环境变量

不要把真实的 `.env`、`.env.*.local` 提交进仓库。必填项见后端 [moyu-system-server/.env.example](./moyu-system-server/.env.example)：

- `DATABASE_URL`
- `JWT_SECRET`
- `SESSION_SECRET`

前端模板见 [moyu-system-react/.env.example](./moyu-system-react/.env.example)。开发默认 `VITE_BASE_URL=http://localhost:3000`。

对应关系：

| 环境 | 前端命令 | 后端命令 | 配置文件 |
|------|----------|----------|----------|
| development | `npm run dev` / `npm run build:dev` | `npm run start:dev` | `.env.development` |
| test | `npm run build:test` / `npm run preview:test` | `npm run start:test` | `.env.test` |
| production | `npm run build` / `npm run preview` | `npm run start:prod` | `.env.production` |

---

## 接口约定

```text
管理端
    │  Bearer + tenant-id
    ▼
POST /admin/auth/login  →  校验验证码、租户状态、密码
    │
    ├─ accessToken / refreshToken
    └─ 菜单与权限码

后续请求 → JwtGuard → TenantGuard → Permission
写操作可按需记录操作日志
```

- API 前缀：`/admin/*`。健康检查：`/health`。
- 认证头：`Authorization: Bearer <accessToken>`。刷新令牌使用 `POST /admin/auth/refresh-token` 的 **Body**，不要放在 Query。
- 账密登录需先调用 `GET /admin/captcha/get`。开发环境可用 `AUTH_CAPTCHA_ENABLED=false` 关闭验证码。
- 超管角色编码为 `super_admin`，会跳过权限码校验。开放注册默认关闭，需设置 `AUTH_REGISTER_ENABLED=true` 才开启。
- 生产环境须配置 `cors.origins`，并使用足够长的 JWT / Session 密钥。短信回调需配置 `SMS_CALLBACK_SECRET`。

---

## 许可证

[MIT](./LICENSE) © 2026 advater
