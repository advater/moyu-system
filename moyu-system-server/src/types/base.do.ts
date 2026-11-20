/**
 * 基础数据对象
 */
export class BaseDO {
  /**
   * 创建时间
   */
  createTime: Date;
  /**
   * 最后更新时间
   */
  updateTime: Date;
  /**
   * 创建者，目前使用 SysUser 的 id 编号
   *
   * 使用 String 类型的原因是，未来可能会存在非数值的情况，留好拓展性。
   */
  creator: string;
  /**
   * 更新者，目前使用 SysUser 的 id 编号
   *
   * 使用 String 类型的原因是，未来可能会存在非数值的情况，留好拓展性。
   */
  updater: string;
  /**
   * 是否删除
   */
  deleted: boolean;
}