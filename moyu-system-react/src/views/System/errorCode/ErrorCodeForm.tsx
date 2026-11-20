import { useEffect } from "react";
import { usePendingOpen } from "@/hooks/usePendingOpen";
import { Form, Input, InputNumber, Modal, Select, message } from "antd";
import * as ErrorCodeApi from "@/api/system/errorCode";

export default function ErrorCodeForm({
  open, type, id, onClose, onSuccess,
}: { open: boolean; type: "create" | "update"; id?: number; onClose: () => void; onSuccess: () => void }) {
  const [form] = Form.useForm();
  const pendingKey = open && type === "update" && id ? String(id) : null;
  const { loading, setSubmitting, completePending } = usePendingOpen(pendingKey);
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (type === "update" && id) {
      const key = String(id);
      let cancelled = false;
      ErrorCodeApi.getErrorCode(id).then((data) => form.setFieldsValue(data)).finally(() => { if (!cancelled) completePending(key); });
      return () => { cancelled = true; };
    } else {
      form.setFieldsValue({ type: 2, applicationName: "moyu-system-server" });
    }
  }, [open, type, id, completePending]);
  const submit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (type === "create") {
        await ErrorCodeApi.createErrorCode(values);
        message.success("新增成功");
      } else {
        await ErrorCodeApi.updateErrorCode({ ...values, id });
        message.success("修改成功");
      }
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Modal open={open} title={type === "create" ? "新增错误码" : "修改错误码"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden>
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="type" label="类型" rules={[{ required: true, message: "请选择类型" }]}>
          <Select
            options={[
              { label: "自动生成", value: 1 },
              { label: "手动维护", value: 2 },
            ]}
          />
        </Form.Item>
        <Form.Item name="applicationName" label="应用名" rules={[{ required: true, message: "请输入应用名" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="code" label="错误码" rules={[{ required: true, message: "请输入错误码" }]}>
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="message" label="错误提示" rules={[{ required: true, message: "请输入错误提示" }]}>
          <Input.TextArea rows={3} placeholder='i18n key、双语 JSON 或自由文本' />
        </Form.Item>
        <Form.Item name="memo" label="备注">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
