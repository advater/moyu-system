import { useCallback, useEffect, useState } from "react";
import { Form, message } from "antd";
import { getAreaByIp, getAreaTree } from "@/api/system/area";

export function useAreaPage() {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ipOpen, setIpOpen] = useState(false);
  const [ipLoading, setIpLoading] = useState(false);
  const [ipResult, setIpResult] = useState("");
  const [form] = Form.useForm();

  const loadTree = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAreaTree();
      setTreeData(Array.isArray(data) ? data : data?.list || []);
    } catch {
      message.error("加载地区数据失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const openIp = () => {
    setIpOpen(true);
    setIpResult("");
    form.resetFields();
  };

  const closeIp = () => setIpOpen(false);

  const queryIp = async () => {
    const { ip } = await form.validateFields();
    setIpLoading(true);
    try {
      const name = await getAreaByIp(ip);
      setIpResult(name || "未知");
    } finally {
      setIpLoading(false);
    }
  };

  return {
    treeData,
    loading,
    ipOpen,
    ipLoading,
    ipResult,
    form,
    openIp,
    closeIp,
    queryIp,
  };
}
