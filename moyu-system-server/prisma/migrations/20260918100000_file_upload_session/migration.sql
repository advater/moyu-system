-- 大文件：sys_file.size 扩容，增加 hash / 存储类型；新增分片会话表
-- 对存量库可重复执行（列/索引已存在时跳过）

ALTER TABLE `sys_file`
  MODIFY COLUMN `size` BIGINT NOT NULL DEFAULT 0;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_file' AND COLUMN_NAME = 'hash'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE `sys_file` ADD COLUMN `hash` VARCHAR(64) NULL AFTER `size`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_file' AND COLUMN_NAME = 'storage_kind'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE `sys_file` ADD COLUMN `storage_kind` VARCHAR(16) NULL AFTER `hash`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_file' AND INDEX_NAME = 'sys_file_tenant_id_hash_idx'
);
SET @sql := IF(@idx = 0,
  'CREATE INDEX `sys_file_tenant_id_hash_idx` ON `sys_file` (`tenant_id`, `hash`)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `sys_file_upload` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `upload_id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(256) NOT NULL,
  `mime` VARCHAR(128) NOT NULL,
  `ext` VARCHAR(16) NOT NULL,
  `size` BIGINT NOT NULL,
  `hash` VARCHAR(64) NOT NULL,
  `hash_type` VARCHAR(32) NOT NULL,
  `chunk_size` INT NOT NULL,
  `total_chunks` INT NOT NULL,
  `uploaded_indexes` JSON NOT NULL,
  `storage_kind` VARCHAR(16) NOT NULL,
  `oss_upload_id` VARCHAR(256) NULL,
  `dest_path` VARCHAR(512) NOT NULL,
  `part_etags` JSON NULL,
  `file_id` INT UNSIGNED NULL,
  `status` VARCHAR(16) NOT NULL,
  `expire_at` DATETIME(3) NOT NULL,
  `creator` VARCHAR(64) NULL,
  `updater` VARCHAR(64) NULL,
  `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sys_file_upload_upload_id_key` (`upload_id`),
  KEY `sys_file_upload_tenant_id_idx` (`tenant_id`),
  KEY `sys_file_upload_tenant_id_hash_idx` (`tenant_id`, `hash`),
  KEY `sys_file_upload_status_expire_at_idx` (`status`, `expire_at`),
  KEY `sys_file_upload_deleted_at_idx` (`deleted_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
