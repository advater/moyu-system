import { Pagination } from "antd";

interface PagerProps {
  /** 总条数 */
  total: number;
  /** 当前页码 */
  current: number;
  /** 每页条数 */
  pageSize: number;
  /** 每页条数选项 */
  pageSizes?: number[];
  /** 分页变化回调 */
  onChange?: (page: number, pageSize: number) => void;
  /** 每页条数变化回调 */
  onShowSizeChange?: (page: number, pageSize: number) => void;
  /** 是否显示快速跳转 */
  showQuickJumper?: boolean;
  /** 是否显示每页条数选择器 */
  showSizeChanger?: boolean;
  /** 对齐方式 */
  align?: "start" | "center" | "end";
  /** 自定义类名 */
  className?: string;
}

const DEFAULT_PAGE_SIZES = [10, 20, 50];

export default function Pager({
  total,
  current,
  pageSize,
  pageSizes = DEFAULT_PAGE_SIZES,
  onChange,
  onShowSizeChange,
  showQuickJumper = true,
  showSizeChanger = true,
  align = "end",
  className = "",
}: PagerProps) {
  return (
    <div className={`pager-wrapper ${className}`}>
      <Pagination
        align={align}
        total={total}
        showTotal={(total, range) =>
          `${range[0]}-${range[1]} of ${total} items`
        }
        current={current}
        pageSize={pageSize}
        pageSizeOptions={pageSizes}
        showQuickJumper={showQuickJumper}
        showSizeChanger={showSizeChanger}
        onShowSizeChange={onShowSizeChange}
        onChange={onChange}
      />
    </div>
  );
}