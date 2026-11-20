-- 定时任务（平台级）
CREATE TABLE IF NOT EXISTS `sys_job` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(64) NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `handler_name` VARCHAR(64) NOT NULL,
  `handler_param` VARCHAR(255) NULL,
  `cron_expression` VARCHAR(64) NOT NULL,
  `retry_count` INT NOT NULL DEFAULT 0,
  `retry_interval` INT NOT NULL DEFAULT 0,
  `monitor_timeout` INT NOT NULL DEFAULT 0,
  `remark` VARCHAR(500) NULL,
  `creator` VARCHAR(64) NULL,
  `updater` VARCHAR(64) NULL,
  `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_job_name` (`name`),
  KEY `sys_job_handler_name_idx` (`handler_name`),
  KEY `sys_job_status_idx` (`status`),
  KEY `sys_job_deleted_at_idx` (`deleted_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 定时任务执行日志
CREATE TABLE IF NOT EXISTS `sys_job_log` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `job_id` INT UNSIGNED NOT NULL,
  `handler_name` VARCHAR(64) NOT NULL,
  `handler_param` VARCHAR(255) NULL,
  `execute_index` INT NOT NULL DEFAULT 1,
  `begin_time` DATETIME(3) NOT NULL,
  `end_time` DATETIME(3) NULL,
  `duration` INT NULL,
  `status` TINYINT NOT NULL DEFAULT 0,
  `result` VARCHAR(4000) NULL,
  `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `sys_job_log_job_id_idx` (`job_id`),
  KEY `sys_job_log_handler_name_idx` (`handler_name`),
  KEY `sys_job_log_begin_time_idx` (`begin_time`),
  KEY `sys_job_log_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- API 访问日志
CREATE TABLE IF NOT EXISTS `sys_api_access_log` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id` VARCHAR(64) NOT NULL,
  `trace_id` VARCHAR(64) NULL,
  `user_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `user_type` TINYINT NOT NULL DEFAULT 0,
  `application_name` VARCHAR(50) NOT NULL,
  `request_method` VARCHAR(16) NOT NULL,
  `request_url` VARCHAR(512) NOT NULL,
  `request_params` TEXT NULL,
  `response_body` TEXT NULL,
  `user_ip` VARCHAR(50) NULL,
  `user_agent` VARCHAR(512) NULL,
  `operate_module` VARCHAR(50) NULL,
  `operate_name` VARCHAR(50) NULL,
  `operate_type` TINYINT NOT NULL DEFAULT 0,
  `begin_time` DATETIME(3) NOT NULL,
  `end_time` DATETIME(3) NOT NULL,
  `duration` INT NOT NULL DEFAULT 0,
  `result_code` INT NOT NULL DEFAULT 0,
  `result_msg` VARCHAR(512) NULL,
  `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `sys_api_access_log_tenant_id_idx` (`tenant_id`),
  KEY `sys_api_access_log_user_id_idx` (`user_id`),
  KEY `sys_api_access_log_begin_time_idx` (`begin_time`),
  KEY `sys_api_access_log_request_url_idx` (`request_url`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- API 异常日志
CREATE TABLE IF NOT EXISTS `sys_api_error_log` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id` VARCHAR(64) NOT NULL,
  `trace_id` VARCHAR(64) NULL,
  `user_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `user_type` TINYINT NOT NULL DEFAULT 0,
  `application_name` VARCHAR(50) NOT NULL,
  `request_method` VARCHAR(16) NOT NULL,
  `request_url` VARCHAR(512) NOT NULL,
  `request_params` TEXT NULL,
  `user_ip` VARCHAR(50) NULL,
  `user_agent` VARCHAR(512) NULL,
  `exception_time` DATETIME(3) NOT NULL,
  `exception_name` VARCHAR(128) NOT NULL,
  `exception_message` TEXT NULL,
  `exception_root_cause_message` TEXT NULL,
  `exception_stack_trace` TEXT NULL,
  `exception_class_name` VARCHAR(256) NULL,
  `exception_file_name` VARCHAR(256) NULL,
  `exception_method_name` VARCHAR(128) NULL,
  `exception_line_number` INT NULL,
  `process_status` TINYINT NOT NULL DEFAULT 0,
  `process_time` DATETIME(3) NULL,
  `process_user_id` INT UNSIGNED NULL,
  `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `sys_api_error_log_tenant_id_idx` (`tenant_id`),
  KEY `sys_api_error_log_user_id_idx` (`user_id`),
  KEY `sys_api_error_log_exception_time_idx` (`exception_time`),
  KEY `sys_api_error_log_process_status_idx` (`process_status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 业务错误码
CREATE TABLE IF NOT EXISTS `sys_error_code` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id` VARCHAR(64) NOT NULL,
  `type` TINYINT NOT NULL DEFAULT 2,
  `application_name` VARCHAR(50) NOT NULL,
  `code` INT NOT NULL,
  `message` VARCHAR(512) NOT NULL,
  `memo` VARCHAR(512) NULL,
  `creator` VARCHAR(64) NULL,
  `updater` VARCHAR(64) NULL,
  `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_app_error_code` (`tenant_id`, `application_name`, `code`),
  KEY `sys_error_code_tenant_id_idx` (`tenant_id`),
  KEY `sys_error_code_code_idx` (`code`),
  KEY `sys_error_code_deleted_at_idx` (`deleted_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 内置清理任务种子（可管理端改 cron / 启停）
INSERT INTO `sys_job` (`name`, `status`, `handler_name`, `handler_param`, `cron_expression`, `retry_count`, `retry_interval`, `monitor_timeout`, `remark`, `creator`)
SELECT * FROM (
  SELECT '清理过期令牌' AS name, 1 AS status, 'system.cleanExpiredTokens' AS handler_name,
         NULL AS handler_param, '0 0 * * * *' AS cron_expression, 0 AS retry_count, 0 AS retry_interval,
         0 AS monitor_timeout, '每小时软删过期 OAuth2 access/refresh/code' AS remark, 'system' AS creator
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `sys_job` WHERE `name` = '清理过期令牌' AND `deleted` = 0);

INSERT INTO `sys_job` (`name`, `status`, `handler_name`, `handler_param`, `cron_expression`, `retry_count`, `retry_interval`, `monitor_timeout`, `remark`, `creator`)
SELECT * FROM (
  SELECT '清理超期日志' AS name, 1 AS status, 'system.cleanOldLogs' AS handler_name,
         NULL AS handler_param, '0 0 3 * * *' AS cron_expression, 0 AS retry_count, 0 AS retry_interval,
         0 AS monitor_timeout, '每天 03:00 按 LOG_RETENTION_DAYS 软删登录/操作日志' AS remark, 'system' AS creator
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `sys_job` WHERE `name` = '清理超期日志' AND `deleted` = 0);
