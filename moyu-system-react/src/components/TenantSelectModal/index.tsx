import { Button, Modal } from "antd";
import { useTranslation } from "react-i18next";
import { useTenant } from "@/hooks/useTenant";

export default function TenantSelectModal() {
  const { t } = useTranslation();
  const { tenants, selectRequired, tenantEnable, setSelectRequired, changeTenant } = useTenant();

  const handleSelect = async (id: number) => {
    await changeTenant(id);
    setSelectRequired(false);
  };

  return (
    <Modal
      title={t("login.tenantname")}
      open={tenantEnable && selectRequired}
      closable={false}
      maskClosable={false}
      footer={null}
    >
      <p style={{ marginBottom: 16 }}>{t("common.selectText")}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tenants.map((tenant) => (
          <Button key={tenant.id} block onClick={() => handleSelect(tenant.id)}>
            {tenant.name || `${t("login.tenantname")} ${tenant.id}`}
          </Button>
        ))}
      </div>
    </Modal>
  );
}
