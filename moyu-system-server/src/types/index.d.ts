/**
 * 分页结果
 */
export interface PageResult<T> {
  /**
   * 分页列表
   */
  list: Array<T>;
  /**
   * 总记录数
   */
  total: number;
}