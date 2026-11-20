import { useState } from "react";
import { useCrudList } from "@/hooks/useCrudList";
import { downloadExcel } from "@/utils/file/down";
import * as LoginLogApi from "@/api/system/loginLog";

export function useLoginLogPage() {
  const crud = useCrudList<LoginLogApi.LoginLogVO>(LoginLogApi.getLoginLogPage);
  const [exportLoading, setExportLoading] = useState(false);
  const [detail, setDetail] = useState<LoginLogApi.LoginLogVO | null>(null);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      downloadExcel(await LoginLogApi.exportLoginLog(crud.queryParams()), "登录日志.xls");
    } finally {
      setExportLoading(false);
    }
  };

  return {
    ...crud,
    exportLoading,
    detail,
    setDetail,
    handleExport,
  };
}
