import { Modal, message } from "antd";
import { useCrudList } from "@/hooks/useCrudList";
import { useStatusChange } from "@/components/StatusSwitch";
import * as TenantPackageApi from "@/api/system/tenantPackage";
import type { TenantPackageVO } from "@/api/system/tenantPackage";
import { useState } from "react";

export function useTenantPackagePage() {
  const crud = useCrudList<TenantPackageVO>(TenantPackageApi.getTenantPackagePage);
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [formId, setFormId] = useState<number>();

  const handleStatusChange = useStatusChange(TenantPackageApi.updateTenantPackage, crud.getList);

  const openForm = (type: "create" | "update", id?: number) => {
    setFormType(type);
    setFormId(id);
    setFormOpen(true);
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "提示",
      content: "确认删除该套餐？",
      onOk: async () => {
        await TenantPackageApi.deleteTenantPackage(id);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleDeleteBatch = () => {
    modal.confirm({
      title: "提示",
      content: `确认删除选中的 ${crud.selectedIds.length} 条套餐？`,
      onOk: async () => {
        await TenantPackageApi.deleteTenantPackageList(crud.selectedIds);
        crud.setSelectedIds([]);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  return {
    ...crud,
    modalHolder,
    messageHolder,
    formOpen,
    formType,
    formId,
    setFormOpen,
    openForm,
    handleDelete,
    handleDeleteBatch,
    handleStatusChange,
  };
}
