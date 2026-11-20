import { useEffect, useState } from "react";
import { Form, Input, InputNumber, Modal, Switch, message } from "antd";
import * as MailAccountApi from "@/api/system/mail/account";

export default function MailAccountForm({
  open, type, id, onClose, onSuccess,
}: { open: boolean; type: "create" | "update"; id?: number; onClose: () => void; onSuccess: () => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (type === "update" && id) {
      setLoading(true);
      MailAccountApi.getMailAccount(id).then((data) => form.setFieldsValue({ ...data, password: undefined })).finally(() => setLoading(false));
    } else {
      form.setFieldsValue({ sslEnable: true, starttlsEnable: false, port: 465 });
    }
  }, [open, type, id]);
  const submit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (type === "create") { await MailAccountApi.createMailAccount(values); message.success("新增成功"); }
      else { await MailAccountApi.updateMailAccount({ ...values, id }); message.success("修改成功"); }
      onSuccess();
    } finally { setLoading(false); }
  };
  return (
    <Modal open={open} title={type === "create" ? "新增邮箱账号" : "修改邮箱账号"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden>
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="mail" label="邮箱" rules={[{ required: true, message: "邮箱不能为空" }]}><Input /></Form.Item>
        <Form.Item name="username" label="用户名" rules={[{ required: true, message: "用户名不能为空" }]}><Input /></Form.Item>
        <Form.Item name="password" label="密码" rules={type === "create" ? [{ required: true, message: "密码不能为空" }] : []}>
          <Input.Password placeholder={type === "update" ? "不修改请留空" : ""} />
        </Form.Item>
        <Form.Item name="host" label="SMTP 服务器" rules={[{ required: true, message: "SMTP 服务器不能为空" }]}><Input /></Form.Item>
        <Form.Item name="port" label="SMTP 端口" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
        <Form.Item name="sslEnable" label="开启 SSL" valuePropName="checked"><Switch /></Form.Item>
        <Form.Item name="starttlsEnable" label="开启 STARTTLS" valuePropName="checked"><Switch /></Form.Item>
      </Form>
    </Modal>
  );
}
