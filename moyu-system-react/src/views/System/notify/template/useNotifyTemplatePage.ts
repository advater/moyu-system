import { useEffect, useState } from "react";
import { Modal, message } from "antd";
import { useCrudList } from "@/hooks/useCrudList";
import { useStatusChange } from "@/components/StatusSwitch";
import * as NotifyTemplateApi from "@/api/system/notify/template";
import * as UserApi from "@/api/system/user";

export function useNotifyTemplatePage() {
  const crud = useCrudList<NotifyTemplateApi.NotifyTemplateVO>(NotifyTemplateApi.getNotifyTemplatePage);
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();
  const [users, setUsers] = useState<UserApi.UserVO[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [formId, setFormId] = useState<number>();
  const [sendTemplate, setSendTemplate] = useState<NotifyTemplateApi.NotifyTemplateVO | null>(null);
  const [sendLoading, setSendLoading] = useState(false);

  const handleStatusChange = useStatusChange(NotifyTemplateApi.updateNotifyTemplate, crud.getList);

  useEffect(() => {
    UserApi.getSimpleUserList().then(setUsers).catch(() => setUsers([]));
  }, []);

  const openForm = (type: "create" | "update", id?: number) => {
    setFormType(type);
    setFormId(id);
    setFormOpen(true);
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "提示",
      content: "确认删除该站内信模板？",
      onOk: async () => {
        await NotifyTemplateApi.deleteNotifyTemplate(id);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleDeleteBatch = () => {
    modal.confirm({
      title: "提示",
      content: `确认删除选中的 ${crud.selectedIds.length} 条模板？`,
      onOk: async () => {
        await NotifyTemplateApi.deleteNotifyTemplateList(crud.selectedIds);
        crud.setSelectedIds([]);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleSend = async (values: Record<string, any>) => {
    setSendLoading(true);
    try {
      await NotifyTemplateApi.sendNotify({
        userId: values.userId,
        userType: values.userType,
        templateCode: sendTemplate!.code,
        templateParams: values.templateParams,
      });
      messageApi.success("发送成功");
      setSendTemplate(null);
    } finally {
      setSendLoading(false);
    }
  };

  return {
    ...crud,
    modalHolder,
    messageHolder,
    users,
    formOpen,
    formType,
    formId,
    setFormOpen,
    sendOpen: !!sendTemplate,
    sendTemplate,
    setSendTemplate,
    sendLoading,
    openForm,
    handleDelete,
    handleDeleteBatch,
    handleSend,
    handleStatusChange,
  };
}
