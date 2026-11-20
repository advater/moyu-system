import { useCallback, useEffect, useState } from "react";
import { Form } from "antd";
import { usePagination } from "@/hooks/usePagination";

type PageResult<T> = { list?: T[]; total?: number };

type Fetcher<T> = (params: Record<string, any>) => Promise<PageResult<T>>;

export function useCrudList<T = any>(fetcher: Fetcher<T>, extraParams?: () => Record<string, any>) {
  const [form] = Form.useForm();
  const { pageData, handleCurrentChange, handleSizeChange, resetPageData, setTotal } =
    usePagination();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<T[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTick, setSearchTick] = useState(0);

  const queryParams = useCallback(() => {
    const values = form.getFieldsValue();
    const extra = extraParams?.() || {};
    const createTime = values.createTime?.map((d: any) => d.format("YYYY-MM-DD HH:mm:ss"));
    return {
      page: pageData.currentPage,
      pageSize: pageData.pageSize,
      ...values,
      ...extra,
      ...(createTime ? { createTime } : {}),
    };
  }, [form, pageData.currentPage, pageData.pageSize, extraParams]);

  const getList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetcher(queryParams());
      setList(data?.list || []);
      setTotal(data?.total || 0);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [fetcher, queryParams, setTotal]);

  useEffect(() => {
    getList();
  }, [pageData.currentPage, pageData.pageSize, searchTick]);

  const handleQuery = () => {
    resetPageData();
    setSearchTick(Date.now());
  };

  const handleReset = () => {
    form.resetFields();
    resetPageData();
    setSearchTick(Date.now());
  };

  return {
    form,
    pageData,
    loading,
    list,
    selectedIds,
    setSelectedIds,
    queryParams,
    getList,
    handleQuery,
    handleReset,
    handleCurrentChange,
    handleSizeChange,
  };
}
