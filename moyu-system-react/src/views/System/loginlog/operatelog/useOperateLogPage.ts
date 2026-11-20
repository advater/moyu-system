import { useEffect, useState } from "react";
import { useCrudList } from "@/hooks/useCrudList";
import { downloadExcel } from "@/utils/file/down";
import * as OperateLogApi from "@/api/system/operatelog";
import * as UserApi from "@/api/system/user";

export function useOperateLogPage() {
  const crud = useCrudList<OperateLogApi.OperateLogVO>(OperateLogApi.getOperateLogPage);
  const [exportLoading, setExportLoading] = useState(false);
  const [userList, setUserList] = useState<UserApi.UserVO[]>([]);
  const [detail, setDetail] = useState<OperateLogApi.OperateLogVO | null>(null);

  useEffect(() => {
    UserApi.getSimpleUserList().then(setUserList).catch(() => setUserList([]));
  }, []);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      downloadExcel(await OperateLogApi.exportOperateLog(crud.queryParams()), "操作日志.xls");
    } finally {
      setExportLoading(false);
    }
  };

  return {
    ...crud,
    exportLoading,
    userList,
    detail,
    setDetail,
    handleExport,
  };
}
