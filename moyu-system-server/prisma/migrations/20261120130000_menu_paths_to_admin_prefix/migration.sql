-- 前端菜单路由前缀：/system、/infra → /admin
-- 只改 path，不改 permission（如 system:user:query）和 component（如 system/user/index）
SET NAMES utf8mb4;

UPDATE `sys_menu`
SET `path` = '/admin', `updater` = '1', `update_time` = NOW()
WHERE `path` = '/system';

UPDATE `sys_menu`
SET `path` = CONCAT('/admin', SUBSTRING(`path`, 8)), `updater` = '1', `update_time` = NOW()
WHERE `path` LIKE '/system/%';

UPDATE `sys_menu`
SET `path` = 'admin', `updater` = '1', `update_time` = NOW()
WHERE `path` = 'system';

UPDATE `sys_menu`
SET `path` = CONCAT('admin', SUBSTRING(`path`, 7)), `updater` = '1', `update_time` = NOW()
WHERE `path` LIKE 'system/%';

UPDATE `sys_menu`
SET `path` = '/admin', `updater` = '1', `update_time` = NOW()
WHERE `path` = '/infra';

UPDATE `sys_menu`
SET `path` = CONCAT('/admin', SUBSTRING(`path`, 7)), `updater` = '1', `update_time` = NOW()
WHERE `path` LIKE '/infra/%';

UPDATE `sys_menu`
SET `path` = 'admin', `updater` = '1', `update_time` = NOW()
WHERE `path` = 'infra';

UPDATE `sys_menu`
SET `path` = CONCAT('admin', SUBSTRING(`path`, 6)), `updater` = '1', `update_time` = NOW()
WHERE `path` LIKE 'infra/%';
