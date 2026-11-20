import { createSlice } from "@reduxjs/toolkit";
import { useAppDispatch, useAppSelector } from "../../hooks";
import type { ITenantOption } from "@/types/permission";
import { getTenantId as readTenantId, setTenantId as writeTenantId } from "@/utils/auth";
import { env } from "@/config/env";

const tenantSlice = createSlice({
  name: "tenant",
  initialState: {
    tenantId: readTenantId(),
    tenantEnable: env.tenantEnable,
    tenants: [] as ITenantOption[],
    selectRequired: false,
  },
  reducers: {
    setTenantState: (state, action) => {
      const { tenantId, tenants, selectRequired, tenantEnable } = action.payload || {};
      if (tenantId !== undefined) state.tenantId = String(tenantId ?? "");
      if (tenants) state.tenants = tenants;
      if (selectRequired !== undefined) state.selectRequired = selectRequired;
      if (tenantEnable !== undefined) state.tenantEnable = tenantEnable;
    },
    setSelectRequired: (state, action) => {
      state.selectRequired = action.payload;
    },
    resetTenant: (state) => {
      state.selectRequired = false;
      state.tenants = [];
    },
  },
});

export const { setTenantState, setSelectRequired, resetTenant } = tenantSlice.actions;
export default tenantSlice.reducer;

export const useTenantStore = () => {
  const tenantId = useAppSelector((state) => state.tenant.tenantId);
  const tenantEnable = useAppSelector((state) => state.tenant.tenantEnable);
  const tenants = useAppSelector((state) => state.tenant.tenants);
  const selectRequired = useAppSelector((state) => state.tenant.selectRequired);
  const dispatch = useAppDispatch();

  return {
    tenantId,
    tenantEnable,
    tenants,
    selectRequired,
    setTenantId: (id: number | string) => {
      writeTenantId(id);
      dispatch(setTenantState({ tenantId: id }));
    },
    setTenants: (list: ITenantOption[]) => dispatch(setTenantState({ tenants: list })),
    setSelectRequired: (open: boolean) => dispatch(setSelectRequired(open)),
    resetTenant: () => dispatch(resetTenant()),
  };
};
