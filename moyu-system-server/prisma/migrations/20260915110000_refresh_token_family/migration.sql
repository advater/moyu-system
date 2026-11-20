-- 刷新令牌轮换 + 重放侦测：家族编号（同一登录会话的轮换链共用，重放命中时整族吊销）
ALTER TABLE `sys_oauth2_refresh_token`
  ADD COLUMN `family_id` VARCHAR(64) NULL AFTER `client_id`;

-- 存量数据：每条旧刷新令牌自成家族；后续轮换出的新令牌继承该编号
UPDATE `sys_oauth2_refresh_token`
  SET `family_id` = `refresh_token`
  WHERE `family_id` IS NULL;

ALTER TABLE `sys_oauth2_refresh_token`
  MODIFY COLUMN `family_id` VARCHAR(64) NOT NULL,
  ADD INDEX `sys_oauth2_refresh_token_family_id_idx` (`family_id`);
