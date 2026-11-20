import { useEffect } from "react";
import { bus } from "@/utils/bus";
import { useTenant } from "@/hooks/useTenant";
import { getCurrentUserInfo } from "@/api/system/user/profile";
import { useUserStore } from "@/store/stores/user";
import Storage from "@/utils/storage";

/** 监听后端「请先选择租户」并打开选择框 */
export default function TenantListener() {
  const { setTenants, setSelectRequired } = useTenant();
  const { setUserInfo } = useUserStore();

  useEffect(() => {
    const open = (list: { id: number; name: string }[]) => {
      if (list.length) {
        setTenants(list);
        setSelectRequired(true);
      }
    };

    const handle = async () => {
      const userData: any = Storage.get("USER_DATA");
      if (userData?.tenants?.length) {
        open(userData.tenants);
        return;
      }
      try {
        const userInfo: any = await getCurrentUserInfo();
        setUserInfo(userInfo);
        Storage.set("USER_DATA", userInfo);
        open(userInfo.tenants || []);
      } catch {
        /* ignore */
      }
    };

    bus.on("tenant:select-required", handle);
    return () => bus.off("tenant:select-required", handle);
  }, [setSelectRequired, setTenants, setUserInfo]);

  return null;
}
