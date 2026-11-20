# NestJS 开发指南

## 项目结构

```
moyu-system-server/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── common/           # 守卫 / 过滤器 / 拦截器 / 租户 ALS / 装饰器
│   ├── config/           # constants、error-messages、yaml
│   ├── database/prisma/  # PrismaService（软删 + 租户扩展）
│   ├── health/           # 健康检查
│   ├── modules/          # 业务模块（auth、user、permission、tenant、oauth2…）
│   ├── plugins/          # redis、logger、captcha
│   ├── types/
│   ├── utils/
│   ├── app.module.ts
│   ├── app.routes.ts     # 业务路由挂载（全局前缀 /admin）
│   └── main.ts           # Fastify + Helmet + CORS + ValidationPipe
├── docs/                 # 审查与说明文档
├── test/
├── config.yaml
└── package.json
```

## 模块约定

业务模块通常包含：

```
foo/
├── dto/
├── entities/
├── repositories/
├── foo.controller.ts   # 常为空 @Controller()，路径由 app.routes.ts 挂载
├── foo.module.ts
└── foo.service.ts


## 安全与租户（摘要）

- 全局守卫：Throttler → Jwt → Tenant → Role → Permission
- 成功/失败响应统一：`{ code, data, message }`
- 租户隔离：`TENANT_SCOPED_MODELS` + Prisma 扩展；菜单/租户/套餐平台共享
- 详细见 [docs/SYSTEM_MODULE.md](docs/SYSTEM_MODULE.md)

## 常用命令

```bash
npm run start:dev
npm run build
npm test
npx prisma migrate deploy
npx prisma generate
```
