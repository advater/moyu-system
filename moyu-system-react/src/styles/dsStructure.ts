/**
 * 结构 token 数值版（供 antd ConfigProvider；不含品牌色）。
 * 与 ./ds-structure.css、live-zb-uni ds-tokens.scss 对齐。
 */
export const dsStructure = {
  radius: 14,
  radiusSmall: 10,
  heightTiny: 22,
  heightSmall: 28,
  heightMedium: 34,
  heightLarge: 40,
  fontSize: 14,
  fontSizeSM: 12,
  fontSizeLG: 15,
  titleSize: 16,
  titleSizeLarge: 18,
  lineHeight: 1.6,
  fontWeight: 400,
  fontWeightStrong: 500,
  menuItemHeight: 42,
  headerHeight: 65,
  contentPadding: '16px 22px',
  cellPadding: 12,
  cellPaddingSM: 8,
  shadow1:
    '0 1px 2px -2px rgba(0, 0, 0, 0.08), 0 3px 6px 0 rgba(0, 0, 0, 0.06), 0 5px 12px 4px rgba(0, 0, 0, 0.04)',
  shadow2:
    '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
  shadow3:
    '0 6px 16px -9px rgba(0, 0, 0, 0.08), 0 9px 28px 0 rgba(0, 0, 0, 0.05), 0 12px 48px 16px rgba(0, 0, 0, 0.03)',
  motionEase: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export type DsStructure = typeof dsStructure;
