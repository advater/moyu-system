-- 租户套餐能力位 features JSON
ALTER TABLE `sys_tenant_package`
  ADD COLUMN `features` JSON NULL AFTER `menu_ids`;
