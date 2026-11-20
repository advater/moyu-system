-- 登录日志增加 IP 归属地
ALTER TABLE `sys_login_log`
  ADD COLUMN `location` VARCHAR(128) NULL AFTER `user_ip`;
