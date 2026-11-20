import { useState } from "react";
import { Modal, message } from "antd";
import { useCrudList } from "@/hooks/useCrudList";
import * as MailAccountApi from "@/api/system/mail/account";

export function useMailAccountPage() {
  const crud = useCrudList<MailAccountApi.MailAccountVO>(MailAccountApi.getMailAccountPage);
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
      content: "确认删除该邮箱账号？",
      onOk: async () => {
        await MailAccountApi.deleteMailAccount(id);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleDeleteBatch = () => {
    modal.confirm({
      title: "提示",
      content: `确认删除选中的 ${crud.selectedIds.length} 条邮箱账号？`,
      onOk: async () => {
        await MailAccountApi.deleteMailAccountList(crud.selectedIds);
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
