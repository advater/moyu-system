# Prisma Migrations

本目录用于存放**版本化**数据库迁移（每个子目录含 `migration.sql`）。

> 手工升级脚本已迁至 [`../manual/`](../manual/)，勿再放在本目录下，否则会被 Prisma 误识别为迁移（P3015）。

## 已提交迁移

| 目录 | 说明 |
|------|------|
| `20260906000000_init_system` | 首版全量建表 |
| `20260906100000_sys_config` | 参数配置表 `sys_config` |
| `20260906110000_sys_file` | 文件元数据表 `sys_file` |
| `20260906120000_login_log_location` | 登录日志 `location` 列 |
| `20260911100000_merge_infra_into_system` | 将「基础设施」菜单并入「系统管理」 |
| `20260915100000_perm_version` | 权限版本化失效：`sys_user.perm_version` + 访问令牌版本快照 |
| `20260915110000_refresh_token_family` | 刷新令牌轮换：`sys_oauth2_refresh_token.family_id`（重放侦测按家族吊销） |
| `20260915120000_user_password_history` | 历史密码表 `sys_user_password_history`（最近 N 条密码不可复用） |
| `20260915130000_login_log_fail_reason` | 登录日志 `fail_reason` 列（记录登录失败原因） |

## 空库初始化

```bash
npx prisma migrate deploy
npx prisma generate
```

## 已有非空库（P3005 baseline）

若库是早期 `db push` / 手工建表、尚无 `_prisma_migrations`：

```bash
# 1. 将已与当前库一致的历史迁移标记为已应用（通常仅 init）
npx prisma migrate resolve --applied 20260906000000_init_system

# 2. 应用尚未落地的增量迁移
npx prisma migrate deploy
```

## 手工升级脚本（存量库可选）

见 [`../manual/`](../manual/)，例如：

| 脚本 | 说明 |
|------|------|
| `upgrade_tenant_boundary.sql` | 业务表补 `tenant_id` |
| `upgrade_user_profile_table.sql` | 新建 `sys_user_profile` |
| `upgrade_sys_config.sql` / `upgrade_sys_file.sql` / `upgrade_login_log_location.sql` | 与对应 migrate 等价，可单独执行 |
| `merge_infra_menus_into_system.sql` | 将「基础设施」菜单并入「系统管理」 |

## 开发期快速同步（勿用于生产）

```bash
npx prisma db push
```
