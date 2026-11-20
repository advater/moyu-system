import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 字典数据实体
 */
export class DictDataDO extends TenantBaseDO {
  /**
   * 字典数据ID 自增主键
   */
  id: number;
  /**
   * 字典排序
   */
  sort: number;
  /**
   * 字典标签
   */
  label: string;
  /**
   * 字典值
   */
  value: string;
  /**
   * 字典类型
   *
   * 冗余 {@link DictDataDO#getDictType()}
   */
  dictType: string;
  /**
   * 状态
   *
   * 枚举 {@link CommonStatusEnum}
   */
  status: number;
  /**
   * 颜色类型
   *
   * 对应到 element-ui 为 default、primary、success、info、warning、danger
   */
  colorType: string;
  /**
   * css 样式
   */
  cssClass: string;
  /**
   * 备注
   */
  remark: string;
}
