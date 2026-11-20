import { useEffect, useState } from "react";
import { Modal, message } from "antd";
import { useCrudList } from "@/hooks/useCrudList";
import { useStatusChange } from "@/components/StatusSwitch";
import * as MailTemplateApi from "@/api/system/mail/template";
import * as MailAccountApi from "@/api/system/mail/account";

export function useMailTemplatePage() {
  const crud = useCrudList<MailTemplateApi.MailTemplateVO>(MailTemplateApi.getMailTemplatePage);
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();
  const [accounts, setAccounts] = useState<MailAccountApi.MailAccountVO[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [formId, setFormId] = useState<number>();
  const [sendTemplate, setSendTemplate] = useState<MailTemplateApi.MailTemplateVO | null>(null);
  const [sendLoading, setSendLoading] = useState(false);

  const handleStatusChange = useStatusChange(MailTemplateApi.updateMailTemplate, crud.getList);

  useEffect(() => {
    MailAccountApi.getSimpleMailAccountList().then(setAccounts).catch(() => setAccounts([]));
  }, []);

  const openForm = (type: "create" | "update", id?: number) => {
    setFormType(type);
    setFormId(id);
    setFormOpen(true);
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "提示",
      content: "确认删除该邮件模板？",
      onOk: async () => {
        await MailTemplateApi.deleteMailTemplate(id);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleDeleteBatch = () => {
    modal.confirm({
      title: "提示",
      content: `确认删除选中的 ${crud.selectedIds.length} 条邮件模板？`,
      onOk: async () => {
        await MailTemplateApi.deleteMailTemplateList(crud.selectedIds);
        crud.setSelectedIds([]);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleSend = async (values: Record<string, any>) => {
    setSendLoading(true);
    try {
      await MailTemplateApi.sendMail({
        toMails: values.toMails,
        ccMails: [],
        bccMails: [],
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
    accounts,
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
