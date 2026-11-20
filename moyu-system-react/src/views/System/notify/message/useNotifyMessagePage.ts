import { useEffect, useState } from "react";
import { useCrudList } from "@/hooks/useCrudList";
import * as NotifyMessageApi from "@/api/system/notify/message";
import * as UserApi from "@/api/system/user";

export function useNotifyMessagePage() {
  const crud = useCrudList<NotifyMessageApi.NotifyMessageVO>(NotifyMessageApi.getNotifyMessagePage);
  const [users, setUsers] = useState<UserApi.UserVO[]>([]);
  const [detail, setDetail] = useState<NotifyMessageApi.NotifyMessageVO | null>(null);

  useEffect(() => {
    UserApi.getSimpleUserList().then(setUsers).catch(() => setUsers([]));
  }, []);

  return {
    ...crud,
    users,
    detail,
    setDetail,
  };
}
