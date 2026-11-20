import { useState } from "react";

interface PageData {
  currentPage?: number;
  pageSize?: number;
  pageSizes?: number[];
  size?: string;
  disabled?: boolean;
  background?: boolean;
  layout?: string;
  total?: number;
}

/** 默认的分页参数 */
const DEFAULT_PAGE_DATA = {
  currentPage: 1,
  pageSize: 10,
  pageSizes: [10, 20, 50],
  size: "default",
  disabled: false,
  background: true,
  layout: "total, sizes, prev, pager, next, jumper",
  total: 0,
};

/** 分页 */
export function usePagination(initPageData: PageData = {}) {
  // 合并分页参数
  const initialData = {
    ...DEFAULT_PAGE_DATA,
    ...initPageData,
  };
  const [pageData, setPageData] = useState(initialData);
  // 改变当前页码
  const handleCurrentChange = (value: number) => {
    setPageData((prev) => ({
      ...prev,
      currentPage: value,
    }));
  };
  // 改变每页显示条数
  const handleSizeChange = (value: number) => {
    setPageData((prev) => ({
      ...prev,
      pageSize: value,
      currentPage: 1,
    }));
  };
  // #重置分页参数
  const resetPageData = () => {
    setPageData((prev) => ({
      ...prev,
      ...initialData,
    }));
  };
  // #设置总条数
  const setTotal = (total: number) => {
    setPageData((prev) => ({
      ...prev,
      total,
    }));
  };

  return {
    pageData,
    handleCurrentChange,
    handleSizeChange,
    resetPageData,
    setTotal,
  };
}
