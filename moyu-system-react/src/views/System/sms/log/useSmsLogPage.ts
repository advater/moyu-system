import { useEffect, useState } from "react";
import { useCrudList } from "@/hooks/useCrudList";
import { downloadExcel } from "@/utils/file/down";
import * as SmsLogApi from "@/api/system/sms/smsLog";
import * as SmsChannelApi from "@/api/system/sms/smsChannel";

export function useSmsLogPage() {
  const crud = useCrudList<SmsLogApi.SmsLogVO>(SmsLogApi.getSmsLogPage);
  const [exportLoading, setExportLoading] = useState(false);
  const [channels, setChannels] = useState<SmsChannelApi.SmsChannelVO[]>([]);
  const [detail, setDetail] = useState<SmsLogApi.SmsLogVO | null>(null);

  useEffect(() => {
    SmsChannelApi.getSimpleSmsChannelList().then(setChannels).catch(() => setChannels([]));
  }, []);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      downloadExcel(await SmsLogApi.exportSmsLog(crud.queryParams()), "短信日志.xls");
    } finally {
      setExportLoading(false);
    }
  };

  return {
    ...crud,
    exportLoading,
    channels,
    detail,
    setDetail,
    handleExport,
  };
}
