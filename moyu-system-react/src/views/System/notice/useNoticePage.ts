import { Modal, message } from "antd";
import { useCrudList } from "@/hooks/useCrudList";
import { useStatusChange } from "@/components/StatusSwitch";
import * as NoticeApi from "@/api/system/notice";
import type { NoticeVO } from "@/api/system/notice";
import { useState } from "react";

export function useNoticePage() {
  const crud = useCrudList<NoticeVO>(NoticeApi.getNoticePage);
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [formId, setFormId] = useState<number>();

  const handleStatusChange = useStatusChange(NoticeApi.updateNotice, crud.getList);

  const openForm = (type: "create" | "update", id?: number) => {
    setFormType(type);
    setFormId(id);
    setFormOpen(true);
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "提示",
      content: "确认删除该公告？",
      onOk: async () => {
        await NoticeApi.deleteNotice(id);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleDeleteBatch = () => {
    modal.confirm({
      title: "提示",
      content: `确认删除选中的 ${crud.selectedIds.length} 条公告？`,
      onOk: async () => {
        await NoticeApi.deleteNoticeList(crud.selectedIds);
        crud.setSelectedIds([]);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handlePush = (id: number) => {
    modal.confirm({
      title: "提示",
      content: "确认向在线用户推送该公告？",
      onOk: async () => {
        await NoticeApi.pushNotice(id);
        messageApi.success("推送成功");
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
    handlePush,
  };
}
