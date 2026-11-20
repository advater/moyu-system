import { Select } from "antd";
import { useTenant } from "@/hooks/useTenant";

export default function TenantSwitch() {
  const { tenantId, tenants, tenantEnable, changeTenant } = useTenant();
  if (!tenantEnable || tenants.length < 2) return null;

  return (
    <Select
      size="small"
      style={{ minWidth: 120, marginRight: 12 }}
      value={tenantId || undefined}
      options={tenants.map((t) => ({ label: t.name, value: String(t.id) }))}
      onChange={(value) => changeTenant(value)}
    />
  );
}
