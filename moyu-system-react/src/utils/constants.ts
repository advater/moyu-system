/** 通用状态：0 关闭 / 1 开启（对齐 moyu-system-server） */
export const CommonStatusEnum = {
  DISABLE: 0,
  ENABLE: 1,
} as const;

export const SystemMenuTypeEnum = {
  DIR: 1,
  MENU: 2,
  BUTTON: 3,
} as const;

export const SystemRoleTypeEnum = {
  SYSTEM: 1,
  CUSTOM: 2,
} as const;

export const SystemDataScopeEnum = {
  ALL: 1,
  DEPT_CUSTOM: 2,
  DEPT_ONLY: 3,
  DEPT_AND_CHILD: 4,
  DEPT_SELF: 5,
} as const;

export const SystemUserSexEnum = {
  UNKNOWN: 0,
  MALE: 1,
  FEMALE: 2,
} as const;
