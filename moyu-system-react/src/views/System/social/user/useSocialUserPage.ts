import { useState } from "react";
import { useCrudList } from "@/hooks/useCrudList";
import * as SocialUserApi from "@/api/system/social/user";
import type { SocialUserVO } from "@/api/system/social/user";

export function useSocialUserPage() {
  const crud = useCrudList<SocialUserVO>(SocialUserApi.getSocialUserPage);
  const [detail, setDetail] = useState<SocialUserVO | null>(null);

  return {
    ...crud,
    detail,
    setDetail,
  };
}
