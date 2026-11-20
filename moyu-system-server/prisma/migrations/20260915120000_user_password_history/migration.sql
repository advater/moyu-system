-- 历史密码表：改密 / 重置密码时记录旧密码哈希，最近 N 条不可复用
CREATE TABLE IF NOT EXISTS `sys_user_password_history` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id` VARCHAR(64) NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `password` VARCHAR(100) NOT NULL,
  `creator` VARCHAR(64) NULL,
  `updater` VARCHAR(64) NULL,
  `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `sys_user_password_history_tenant_user_create_idx` (`tenant_id`, `user_id`, `create_time`),
  KEY `sys_user_password_history_deleted_at_idx` (`deleted_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
