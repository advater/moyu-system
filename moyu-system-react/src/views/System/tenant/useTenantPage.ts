import { Modal, message } from "antd";
import { useCrudList } from "@/hooks/useCrudList";
import { useStatusChange } from "@/components/StatusSwitch";
import { downloadExcel } from "@/utils/file/down";
import * as TenantApi from "@/api/system/tenant";
import type { TenantVO } from "@/api/system/tenant";
import * as TenantPackageApi from "@/api/system/tenantPackage";
import { useEffect, useState } from "react";

export function useTenantPage() {
  const crud = useCrudList<TenantVO>(TenantApi.getTenantPage);
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [formId, setFormId] = useState<number>();
  const [packageList, setPackageList] = useState<TenantPackageApi.TenantPackageVO[]>([]);

  useEffect(() => {
    TenantPackageApi.getTenantPackageList().then(setPackageList).catch(() => setPackageList([]));
  }, []);

  const handleStatusChange = useStatusChange(TenantApi.updateTenant, crud.getList);

  const openForm = (type: "create" | "update", id?: number) => {
    setFormType(type);
    setFormId(id);
    setFormOpen(true);
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "提示",
      content: "确认删除该租户？",
      onOk: async () => {
        await TenantApi.deleteTenant(id);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleDeleteBatch = () => {
    modal.confirm({
      title: "提示",
      content: `确认删除选中的 ${crud.selectedIds.length} 条租户？`,
      onOk: async () => {
        await TenantApi.deleteTenantList(crud.selectedIds);
        crud.setSelectedIds([]);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleExport = async () => {
    downloadExcel(await TenantApi.exportTenant(crud.queryParams()), "租户列表.xls");
  };

  return {
    ...crud,
    modalHolder,
    messageHolder,
    formOpen,
    formType,
    formId,
    packageList,
    setFormOpen,
    openForm,
    handleDelete,
    handleDeleteBatch,
    handleExport,
    handleStatusChange,
  };
}
