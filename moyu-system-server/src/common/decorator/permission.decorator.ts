import { SetMetadata, CustomDecorator } from '@nestjs/common';
import { PERMISSION_KEY, PERMISSION_MODE_KEY } from '@/config/constants';

export { PERMISSION_KEY, PERMISSION_MODE_KEY };

/**
 * 配置权限校验（默认 OR：任一权限码即可）
 * @example
 * @Permission('system:user:query')
 * @Permission('system:user:create', 'system:user:update')
 */
export const Permission = (
  ...permissions: string[]
): CustomDecorator<string> => {
  return SetMetadata(PERMISSION_KEY, permissions);
};

/**
 * 权限校验模式：and=全部具备，or=任一即可（默认）
 */
export const PermissionMode = (
  mode: 'and' | 'or',
): CustomDecorator<string> => {
  return SetMetadata(PERMISSION_MODE_KEY, mode);
};
