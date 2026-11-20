-- 参数配置表（租户隔离；键名租户内唯一）
CREATE TABLE IF NOT EXISTS `sys_config` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id` VARCHAR(64) NOT NULL,
  `category` VARCHAR(50) NULL,
  `name` VARCHAR(100) NOT NULL,
  `config_key` VARCHAR(100) NOT NULL,
  `value` VARCHAR(2000) NOT NULL,
  `visible` TINYINT(1) NOT NULL DEFAULT 1,
  `remark` VARCHAR(500) NULL,
  `creator` VARCHAR(64) NULL,
  `updater` VARCHAR(64) NULL,
  `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_config_key` (`tenant_id`, `config_key`),
  KEY `sys_config_tenant_id_idx` (`tenant_id`),
  KEY `sys_config_category_idx` (`category`),
  KEY `sys_config_deleted_at_idx` (`deleted_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
