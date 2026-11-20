import { useState } from "react";
import { message } from "antd";
import { useCrudList } from "@/hooks/useCrudList";
import * as ApiErrorLogApi from "@/api/system/apiErrorLog";
import type { ApiErrorLogVO } from "@/api/system/apiErrorLog";

export function useApiErrorLogPage() {
  const crud = useCrudList<ApiErrorLogVO>(ApiErrorLogApi.getApiErrorLogPage);
  const [messageApi, messageHolder] = message.useMessage();
  const [detail, setDetail] = useState<ApiErrorLogVO | null>(null);

  const process = async (row: ApiErrorLogVO, processStatus: number) => {
    await ApiErrorLogApi.updateApiErrorLogStatus(row.id, processStatus);
    messageApi.success("处理成功");
    crud.getList();
  };

  return {
    ...crud,
    messageHolder,
    detail,
    setDetail,
    process,
  };
}
