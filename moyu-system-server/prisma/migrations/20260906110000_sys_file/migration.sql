-- 文件元数据表
CREATE TABLE IF NOT EXISTS `sys_file` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(256) NOT NULL,
  `path` VARCHAR(512) NOT NULL,
  `url` VARCHAR(1024) NOT NULL,
  `type` VARCHAR(128) NULL,
  `size` INT NOT NULL DEFAULT 0,
  `creator` VARCHAR(64) NULL,
  `updater` VARCHAR(64) NULL,
  `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `sys_file_tenant_id_idx` (`tenant_id`),
  KEY `sys_file_create_time_idx` (`create_time`),
  KEY `sys_file_deleted_at_idx` (`deleted_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
