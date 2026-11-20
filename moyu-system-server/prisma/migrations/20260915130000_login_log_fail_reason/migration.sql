-- 登录日志增加失败原因
ALTER TABLE `sys_login_log`
  ADD COLUMN `fail_reason` VARCHAR(128) NULL AFTER `user_agent`;
