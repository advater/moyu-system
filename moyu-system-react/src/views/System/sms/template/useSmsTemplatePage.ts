import { useEffect, useState } from "react";
import { Modal, message } from "antd";
import { useCrudList } from "@/hooks/useCrudList";
import { useStatusChange } from "@/components/StatusSwitch";
import { downloadExcel } from "@/utils/file/down";
import * as SmsTemplateApi from "@/api/system/sms/smsTemplate";
import * as SmsChannelApi from "@/api/system/sms/smsChannel";

export function useSmsTemplatePage() {
  const crud = useCrudList<SmsTemplateApi.SmsTemplateVO>(SmsTemplateApi.getSmsTemplatePage);
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();
  const [exportLoading, setExportLoading] = useState(false);
  const [channels, setChannels] = useState<SmsChannelApi.SmsChannelVO[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [formId, setFormId] = useState<number>();
  const [sendTemplate, setSendTemplate] = useState<SmsTemplateApi.SmsTemplateVO | null>(null);
  const [sendLoading, setSendLoading] = useState(false);

  const handleStatusChange = useStatusChange(SmsTemplateApi.updateSmsTemplate, crud.getList);

  useEffect(() => {
    SmsChannelApi.getSimpleSmsChannelList().then(setChannels).catch(() => setChannels([]));
  }, []);

  const openForm = (type: "create" | "update", id?: number) => {
    setFormType(type);
    setFormId(id);
    setFormOpen(true);
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "提示",
      content: "确认删除该短信模板？",
      onOk: async () => {
        await SmsTemplateApi.deleteSmsTemplate(id);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleDeleteBatch = () => {
    modal.confirm({
      title: "提示",
      content: `确认删除选中的 ${crud.selectedIds.length} 条短信模板？`,
      onOk: async () => {
        await SmsTemplateApi.deleteSmsTemplateList(crud.selectedIds);
        crud.setSelectedIds([]);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      downloadExcel(await SmsTemplateApi.exportSmsTemplate(crud.queryParams()), "短信模板.xls");
    } finally {
      setExportLoading(false);
    }
  };

  const handleSend = async (values: Record<string, any>) => {
    setSendLoading(true);
    try {
      await SmsTemplateApi.sendSms({
        mobile: values.mobile,
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
    exportLoading,
    channels,
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
    handleExport,
    handleSend,
    handleStatusChange,
  };
}
