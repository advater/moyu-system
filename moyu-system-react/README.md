# moyu-system-react

[moyu-system](https://github.com/advater/moyu-system) 的 **管理系统前端**。Vite + React + TypeScript + Ant Design。

对接 [moyu-system-server](../moyu-system-server/README.md) 的 `/admin/*`（开发时经 `/admin` 代理到本地后端）。

---

## 功能

管理员在此完成租户与账号治理：

- 登录 / 注册 / 改密 / 个人资料
- 用户、角色、菜单、部门、岗位
- 租户与套餐
- 字典、参数、通知模版、邮件/短信通道
- OAuth2 客户端与令牌
- 文件、定时任务、登录/操作/API 日志

权限码与后端 `@Permission('system:xxx:yyy')` 对齐，菜单由登录接口下发。

---

## 目录架构

```txt
moyu-system-react/
├── src/
│   ├── api/              # 按域拆的 HTTP
│   ├── views/
│   │   ├── Auth/         # 登录、注册、改密
│   │   ├── Profile/
│   │   └── System/       # 用户/角色/租户/字典/通知/文件/日志…
│   ├── layout/           # 壳：侧栏、页签
│   ├── router/
│   ├── store/
│   ├── hooks/            # useAuth / usePermission / useTenant
│   └── utils/request/    # 统一请求与 Token
├── .env.example
├── .env.development
├── .env.test
├── .env.production
├── vite.config.ts        # 代理 /admin → :3000
└── package.json
```

---

## 业务流转

```text
打开管理端 → 选租户 → 验证码登录
    │
    ▼
system-server 发 Token + 菜单
    │
    ▼
布局按菜单渲染 System 页
写操作走 /admin → Vite 代理 → :3000/admin/*
401 刷新令牌失败则回登录页
```

---

## 快速开始

依赖：本机已启动 **moyu-system-server :3000**、MySQL、Redis。

```bash
npm install
npm run dev
```

浏览器：<http://localhost:5173>。

本机覆盖（端口、预填登录等）写在 `.env.development.local`，不要提交。

---

## 脚本与配置

| 命令 | 模式 | 配置文件 |
|------|------|----------|
| `npm run dev` | development | `.env.development` |
| `npm run build:dev` / `npm run preview:dev` | development | `.env.development` |
| `npm run build:test` / `npm run preview:test` | test | `.env.test` |
| `npm run build` / `npm run preview` | production | `.env.production` |
| `npm run lint` | — | — |

开发默认把 `/admin` 代理到 `VITE_BASE_URL`（`http://localhost:3000`）。部署前请在本地覆盖或部署环境中填写实际 API 地址，不要把线上地址写进仓库。

---

## 端口说明

| 用途 | 地址 |
|------|------|
| 本仓 Vite | `:5173`（`VITE_PORT` 可改） |
| 预览 | `npm run preview` 默认 `:4173` |
| 后端 | `VITE_BASE_URL` 默认 `http://localhost:3000` |

---

## 注意事项

- Token、租户头由 `utils/request` 注入；不要在页面里硬编码超管接口。
- `.env`、`.env.local`、`.env.*.local` 不入库；`.env.example` 与 `.env.development` / `.env.test` / `.env.production` 作为模板入库。
