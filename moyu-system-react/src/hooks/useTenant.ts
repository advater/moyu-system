import { useCallback } from "react";
import { useTenantStore } from "@/store/stores/tenant";
import { switchTenant } from "@/utils/auth";

export function useTenant() {
  const store = useTenantStore();

  const changeTenant = useCallback(async (id: number | string) => {
    await switchTenant(id);
  }, []);

  return {
    ...store,
    changeTenant,
  };
}
