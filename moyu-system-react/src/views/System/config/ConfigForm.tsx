import { useEffect, useState } from "react";
import { Form, Input, Modal, Switch, message } from "antd";
import * as ConfigApi from "@/api/system/config";

export default function ConfigForm({
  open, type, id, onClose, onSuccess,
}: { open: boolean; type: "create" | "update"; id?: number; onClose: () => void; onSuccess: () => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (type === "update" && id) {
      setLoading(true);
      ConfigApi.getConfig(id).then((data) => form.setFieldsValue(data)).finally(() => setLoading(false));
    } else {
      form.setFieldsValue({ visible: true });
    }
  }, [open, type, id]);
  const submit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (type === "create") { await ConfigApi.createConfig(values); message.success("新增成功"); }
      else { await ConfigApi.updateConfig({ ...values, id }); message.success("修改成功"); }
      onSuccess();
    } finally { setLoading(false); }
  };
  return (
    <Modal open={open} title={type === "create" ? "新增参数" : "修改参数"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden>
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="category" label="参数分类"><Input /></Form.Item>
        <Form.Item name="name" label="参数名称" rules={[{ required: true, message: "参数名称不能为空" }]}><Input /></Form.Item>
        <Form.Item name="configKey" label="参数键名" rules={[{ required: true, message: "参数键名不能为空" }]}><Input disabled={type === "update"} /></Form.Item>
        <Form.Item name="value" label="参数键值" rules={[{ required: true, message: "参数键值不能为空" }]}><Input.TextArea rows={3} /></Form.Item>
        <Form.Item name="visible" label="是否可见" valuePropName="checked"><Switch /></Form.Item>
        <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
      </Form>
    </Modal>
  );
}
