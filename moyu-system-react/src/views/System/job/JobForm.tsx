import { useEffect } from "react";
import { usePendingOpen } from "@/hooks/usePendingOpen";
import { AutoComplete, Form, Input, InputNumber, Modal, message } from "antd";
import * as JobApi from "@/api/system/job";

export default function JobForm({
  open, type, id, handlers, onClose, onSuccess,
}: {
  open: boolean; type: "create" | "update"; id?: number;
  handlers: string[];
  onClose: () => void; onSuccess: () => void;
}) {
  const [form] = Form.useForm();
  const pendingKey = open && type === "update" && id ? String(id) : null;
  const { loading, setSubmitting, completePending } = usePendingOpen(pendingKey);
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (type === "update" && id) {
      const key = String(id);
      let cancelled = false;
      JobApi.getJob(id).then((data) => form.setFieldsValue(data)).finally(() => { if (!cancelled) completePending(key); });
      return () => { cancelled = true; };
    } else {
      form.setFieldsValue({ retryCount: 0, retryInterval: 0, monitorTimeout: 0 });
    }
  }, [open, type, id, completePending]);
  const submit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (type === "create") { await JobApi.createJob(values); message.success("新增成功"); }
      else { await JobApi.updateJob({ ...values, id }); message.success("修改成功"); }
      onSuccess();
    } finally { setSubmitting(false); }
  };
  return (
    <Modal open={open} title={type === "create" ? "新增定时任务" : "修改定时任务"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden>
      <Form form={form} labelCol={{ span: 7 }} wrapperCol={{ span: 15 }}>
        <Form.Item name="name" label="任务名称" rules={[{ required: true, message: "任务名称不能为空" }]}><Input /></Form.Item>
        <Form.Item name="handlerName" label="处理器名字" rules={[{ required: true, message: "处理器名字不能为空" }]}>
          <AutoComplete options={handlers.map((h) => ({ value: h }))} placeholder="请输入处理器名字" />
        </Form.Item>
        <Form.Item name="handlerParam" label="处理器参数"><Input /></Form.Item>
        <Form.Item name="cronExpression" label="CRON 表达式" rules={[{ required: true, message: "CRON 表达式不能为空" }]}><Input placeholder="0 0 * * * *" /></Form.Item>
        <Form.Item name="retryCount" label="重试次数"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
        <Form.Item name="retryInterval" label="重试间隔(秒)"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
        <Form.Item name="monitorTimeout" label="监控超时(秒)"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
        <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
      </Form>
    </Modal>
  );
}
