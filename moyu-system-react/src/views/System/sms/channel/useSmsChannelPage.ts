import { useState } from "react";
import { Modal, message } from "antd";
import { useCrudList } from "@/hooks/useCrudList";
import { useStatusChange } from "@/components/StatusSwitch";
import * as SmsChannelApi from "@/api/system/sms/smsChannel";

export function useSmsChannelPage() {
  const crud = useCrudList<SmsChannelApi.SmsChannelVO>(SmsChannelApi.getSmsChannelPage);
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [formId, setFormId] = useState<number>();

  const handleStatusChange = useStatusChange(SmsChannelApi.updateSmsChannel, crud.getList);

  const openForm = (type: "create" | "update", id?: number) => {
    setFormType(type);
    setFormId(id);
    setFormOpen(true);
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "提示",
      content: "确认删除该短信渠道？",
      onOk: async () => {
        await SmsChannelApi.deleteSmsChannel(id);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleDeleteBatch = () => {
    modal.confirm({
      title: "提示",
      content: `确认删除选中的 ${crud.selectedIds.length} 条短信渠道？`,
      onOk: async () => {
        await SmsChannelApi.deleteSmsChannelList(crud.selectedIds);
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
