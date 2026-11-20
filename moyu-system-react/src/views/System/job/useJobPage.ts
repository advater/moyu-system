import { useEffect, useState } from "react";
import { Modal, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useCrudList } from "@/hooks/useCrudList";
import * as JobApi from "@/api/system/job";
import type { JobVO } from "@/api/system/job";

export function useJobPage() {
  const navigate = useNavigate();
  const crud = useCrudList<JobVO>(JobApi.getJobPage);
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();
  const [handlers, setHandlers] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [formId, setFormId] = useState<number>();
  const [detail, setDetail] = useState<JobVO | null>(null);

  useEffect(() => {
    JobApi.getJobHandlerList().then((data) => setHandlers(data || [])).catch(() => setHandlers([]));
  }, []);

  const openForm = (type: "create" | "update", id?: number) => {
    setFormType(type);
    setFormId(id);
    setFormOpen(true);
  };

  const handleStatusChange = async (id: number, checked: boolean) => {
    await JobApi.updateJobStatus(id, checked ? 1 : 0);
    messageApi.success("修改成功");
    crud.getList();
  };

  const handleTrigger = (row: JobVO) => {
    modal.confirm({
      title: "提示",
      content: `确认立即执行一次「${row.name}」？`,
      onOk: async () => {
        await JobApi.triggerJob(row.id!);
        messageApi.success("执行成功");
      },
    });
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "提示",
      content: "确认删除该定时任务？",
      onOk: async () => {
        await JobApi.deleteJob(id);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const goJobLog = (id?: number) => {
    navigate(id != null ? `/admin/job/job-log?id=${id}` : "/admin/job/job-log");
  };

  return {
    ...crud,
    modalHolder,
    messageHolder,
    handlers,
    formOpen,
    formType,
    formId,
    detail,
    setFormOpen,
    setDetail,
    openForm,
    handleStatusChange,
    handleTrigger,
    handleDelete,
    goJobLog,
  };
}
