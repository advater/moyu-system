-- 用户强制改密、公告定向、字典唯一约束
ALTER TABLE `sys_user`
  ADD COLUMN `must_change_password` TINYINT(1) NOT NULL DEFAULT 0 AFTER `password_update_time`;

ALTER TABLE `sys_notice`
  ADD COLUMN `target_dept_ids` JSON NULL AFTER `status`,
  ADD COLUMN `target_role_ids` JSON NULL AFTER `target_dept_ids`,
  ADD COLUMN `publish_time` DATETIME(3) NULL AFTER `target_role_ids`;

-- 清理可能冲突后再加唯一（软删行需先改写 value，此处仅对新库/干净数据）
-- 若存量有重复 (tenant_id, dict_type, value)，请先手工去重
ALTER TABLE `sys_dict_data`
  ADD UNIQUE KEY `uk_tenant_dict_type_value` (`tenant_id`, `dict_type`, `value`);

INSERT INTO `sys_job` (`name`, `status`, `handler_name`, `handler_param`, `cron_expression`, `retry_count`, `retry_interval`, `monitor_timeout`, `remark`, `creator`)
SELECT * FROM (
  SELECT '定时推送到期公告' AS name, 1 AS status, 'system.publishDueNotices' AS handler_name,
         NULL AS handler_param, '0 */5 * * * *' AS cron_expression, 0 AS retry_count, 0 AS retry_interval,
         0 AS monitor_timeout, '每 5 分钟推送已到 publish_time 的公告' AS remark, 'system' AS creator
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `sys_job` WHERE `name` = '定时推送到期公告' AND `deleted` = 0);
