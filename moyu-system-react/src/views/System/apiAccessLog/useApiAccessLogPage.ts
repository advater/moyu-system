import { useState } from "react";
import { useCrudList } from "@/hooks/useCrudList";
import * as ApiAccessLogApi from "@/api/system/apiAccessLog";
import type { ApiAccessLogVO } from "@/api/system/apiAccessLog";

export function useApiAccessLogPage() {
  const crud = useCrudList<ApiAccessLogVO>((params) => {
    const beginTime = params.beginTime?.map((d: any) =>
      d?.format ? d.format("YYYY-MM-DD HH:mm:ss") : d,
    );
    return ApiAccessLogApi.getApiAccessLogPage({
      page: params.page,
      pageSize: params.pageSize,
      userId: params.userId,
      applicationName: params.applicationName,
      requestUrl: params.requestUrl,
      beginTime,
    });
  });
  const [detail, setDetail] = useState<ApiAccessLogVO | null>(null);

  return {
    ...crud,
    detail,
    setDetail,
  };
}
