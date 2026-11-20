import { Modal, message } from "antd";
import { useState } from "react";
import { useCrudList } from "@/hooks/useCrudList";
import * as ErrorCodeApi from "@/api/system/errorCode";
import type { ErrorCodeVO } from "@/api/system/errorCode";

export function useErrorCodePage() {
  const crud = useCrudList<ErrorCodeVO>(ErrorCodeApi.getErrorCodePage);
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
      content: "确认删除该错误码？",
      onOk: async () => {
        await ErrorCodeApi.deleteErrorCode(id);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleDeleteBatch = () => {
    modal.confirm({
      title: "提示",
      content: `确认删除选中的 ${crud.selectedIds.length} 条错误码？`,
      onOk: async () => {
        await ErrorCodeApi.deleteErrorCodeList(crud.selectedIds);
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
