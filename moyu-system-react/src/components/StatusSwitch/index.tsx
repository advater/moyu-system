import { useState } from "react";
import { Switch } from "antd";
import { CommonStatusEnum } from "@/utils/constants";
import { usePermission } from "@/hooks/usePermission";

export default function StatusSwitch({
  value,
  permission,
  disabled: disabledProp,
  onChange,
}: {
  value?: number;
  permission?: string;
  disabled?: boolean;
  onChange?: (status: number) => void | Promise<void>;
}) {
  const { hasPermission } = usePermission();
  const [loading, setLoading] = useState(false);
  const disabled = Boolean(disabledProp) || (permission ? !hasPermission(permission) : false);

  return (
    <Switch
      size="small"
      checked={value === CommonStatusEnum.ENABLE}
      disabled={disabled}
      loading={loading}
      onChange={async (checked) => {
        const status = checked ? CommonStatusEnum.ENABLE : CommonStatusEnum.DISABLE;
        setLoading(true);
        try {
          await onChange?.(status);
        } finally {
          setLoading(false);
        }
      }}
    />
  );
}

export function useStatusChange<T extends Record<string, any>>(
  update: (data: Partial<T>) => Promise<unknown>,
  refresh: () => void,
) {
  return async (row: T, status: number) => {
    const { children: _children, statusLocked: _statusLocked, ...rest } = row;
    await update({ ...(rest as T), status });
    refresh();
  };
}
