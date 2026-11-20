import { Modal, message } from "antd";
import { useCrudList } from "@/hooks/useCrudList";
import { useStatusChange } from "@/components/StatusSwitch";
import { downloadExcel } from "@/utils/file/down";
import * as RoleApi from "@/api/system/role";
import type { RoleVO } from "@/api/system/role";
import { useState } from "react";

export function useRolePage() {
  const crud = useCrudList<RoleVO>(RoleApi.getRolePage);
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [formId, setFormId] = useState<number>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleVO | null>(null);

  const handleStatusChange = useStatusChange(RoleApi.updateRole, crud.getList);

  const openForm = (type: "create" | "update", id?: number) => {
    setFormType(type);
    setFormId(id);
    setFormOpen(true);
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "提示",
      content: "确认删除该角色？",
      onOk: async () => {
        await RoleApi.deleteRole(id);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleDeleteBatch = () => {
    modal.confirm({
      title: "提示",
      content: `确认删除选中的 ${crud.selectedIds.length} 条角色？`,
      onOk: async () => {
        await RoleApi.deleteRoleList(crud.selectedIds);
        crud.setSelectedIds([]);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleExport = async () => {
    downloadExcel(await RoleApi.exportRole(crud.queryParams()), "角色数据.xls");
  };

  return {
    ...crud,
    modalHolder,
    messageHolder,
    formOpen,
    formType,
    formId,
    menuOpen,
    dataOpen,
    copyOpen,
    currentRole,
    setFormOpen,
    setMenuOpen,
    setDataOpen,
    setCopyOpen,
    setCurrentRole,
    openForm,
    handleDelete,
    handleDeleteBatch,
    handleExport,
    handleStatusChange,
  };
}
