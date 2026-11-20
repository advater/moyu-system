import { useEffect, useState } from "react";
import { useCrudList } from "@/hooks/useCrudList";
import * as MailLogApi from "@/api/system/mail/log";
import * as MailAccountApi from "@/api/system/mail/account";

export function useMailLogPage() {
  const crud = useCrudList<MailLogApi.MailLogVO>(MailLogApi.getMailLogPage);
  const [accounts, setAccounts] = useState<MailAccountApi.MailAccountVO[]>([]);
  const [detail, setDetail] = useState<MailLogApi.MailLogVO | null>(null);

  useEffect(() => {
    MailAccountApi.getSimpleMailAccountList().then(setAccounts).catch(() => setAccounts([]));
  }, []);

  return {
    ...crud,
    accounts,
    detail,
    setDetail,
  };
}
