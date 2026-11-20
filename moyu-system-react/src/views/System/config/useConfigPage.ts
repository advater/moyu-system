import { Modal, message } from "antd";
import { useState } from "react";
import { useCrudList } from "@/hooks/useCrudList";
import * as ConfigApi from "@/api/system/config";
import type { ConfigVO } from "@/api/system/config";

export function useConfigPage() {
  const crud = useCrudList<ConfigVO>(ConfigApi.getConfigPage);
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [formId, setFormId] = useState<number>();

  const openForm = (type: "create" | "update", id?: number) => {
    setFormType(type);
    setFormId(id);
    setFormOpen(true);
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "提示",
      content: "确认删除该参数？",
      onOk: async () => {
        await ConfigApi.deleteConfig(id);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleDeleteBatch = () => {
    modal.confirm({
      title: "提示",
      content: `确认删除选中的 ${crud.selectedIds.length} 条参数？`,
      onOk: async () => {
        await ConfigApi.deleteConfigList(crud.selectedIds);
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
  };
}
