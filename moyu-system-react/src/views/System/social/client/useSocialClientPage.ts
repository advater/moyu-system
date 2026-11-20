import { Modal, message } from "antd";
import { useState } from "react";
import { useCrudList } from "@/hooks/useCrudList";
import { useStatusChange } from "@/components/StatusSwitch";
import * as SocialClientApi from "@/api/system/social/client";
import type { SocialClientVO } from "@/api/system/social/client";

export function useSocialClientPage() {
  const crud = useCrudList<SocialClientVO>(SocialClientApi.getSocialClientPage);
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [formId, setFormId] = useState<number>();

  const handleStatusChange = useStatusChange(SocialClientApi.updateSocialClient, crud.getList);

  const openForm = (type: "create" | "update", id?: number) => {
    setFormType(type);
    setFormId(id);
    setFormOpen(true);
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "提示",
      content: "确认删除该社交客户端？",
      onOk: async () => {
        await SocialClientApi.deleteSocialClient(id);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleDeleteBatch = () => {
    modal.confirm({
      title: "提示",
      content: `确认删除选中的 ${crud.selectedIds.length} 条社交客户端？`,
      onOk: async () => {
        await SocialClientApi.deleteSocialClientList(crud.selectedIds);
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
