-- 将「基础设施」菜单并入「系统管理」
SET NAMES utf8mb4;

UPDATE `sys_menu`
SET `parent_id` = 12, `updater` = '1', `update_time` = NOW()
WHERE `parent_id` = 88 AND `deleted` = 0;

UPDATE `sys_menu`
SET `deleted` = 1, `deleted_at` = NOW(), `visible` = 0, `updater` = '1', `update_time` = NOW()
WHERE `id` = 88 AND `deleted` = 0;

UPDATE `sys_menu`
SET `parent_id` = 1, `sort` = `sort` + 100, `updater` = '1', `update_time` = NOW()
WHERE `parent_id` = 2 AND `deleted` = 0;

UPDATE `sys_menu`
SET `permission` = CONCAT('system:', SUBSTRING(`permission`, 7)), `updater` = '1', `update_time` = NOW()
WHERE `permission` LIKE 'infra:%';

UPDATE `sys_menu`
SET `component` = CONCAT('system/', SUBSTRING(`component`, 7)), `updater` = '1', `update_time` = NOW()
WHERE `component` LIKE 'infra/%';

UPDATE `sys_menu`
SET `component_name` = CONCAT('System', SUBSTRING(`component_name`, 6)), `updater` = '1', `update_time` = NOW()
WHERE `component_name` LIKE 'Infra%';

UPDATE `sys_menu`
SET `deleted` = 1, `deleted_at` = NOW(), `visible` = 0, `updater` = '1', `update_time` = NOW()
WHERE `id` = 2 AND `deleted` = 0;

DELETE FROM `sys_role_menu` WHERE `menu_id` IN (2, 88);
