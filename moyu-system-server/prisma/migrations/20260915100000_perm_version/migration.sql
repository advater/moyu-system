-- 权限版本化失效：用户权限版本号 + 访问令牌版本快照
-- 赋权/角色变更时递增 sys_user.perm_version，令牌快照不一致即立即失效
ALTER TABLE `sys_user`
  ADD COLUMN `perm_version` INT NOT NULL DEFAULT 0 AFTER `must_change_password`;

ALTER TABLE `sys_oauth2_access_token`
  ADD COLUMN `perm_version` INT NOT NULL DEFAULT 0 AFTER `scopes`;
