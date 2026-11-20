import { useState } from "react";
import { message } from "antd";
import { useCrudList } from "@/hooks/useCrudList";
import * as NotifyMessageApi from "@/api/system/notify/message";

export function useMyNotifyPage() {
  const crud = useCrudList<NotifyMessageApi.NotifyMessageVO>(NotifyMessageApi.getMyNotifyMessagePage);
  const [messageApi, messageHolder] = message.useMessage();
  const [detail, setDetail] = useState<NotifyMessageApi.NotifyMessageVO | null>(null);

  const handleMarkRead = async () => {
    await NotifyMessageApi.updateNotifyMessageRead(crud.selectedIds);
    messageApi.success("标记已读成功");
    crud.setSelectedIds([]);
    crud.getList();
  };

  const handleMarkAllRead = async () => {
    await NotifyMessageApi.updateAllNotifyMessageRead();
    messageApi.success("全部已读成功");
    crud.getList();
  };

  return {
    ...crud,
    messageHolder,
    detail,
    setDetail,
    handleMarkRead,
    handleMarkAllRead,
  };
}
