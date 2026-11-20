import { useEffect, useState } from "react";
import { Form, Input, Modal, Select, message } from "antd";
import * as MailTemplateApi from "@/api/system/mail/template";
import type { MailAccountVO } from "@/api/system/mail/account";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import { CommonStatusEnum } from "@/utils/constants";

export default function MailTemplateForm({
  open, type, id, accounts, onClose, onSuccess,
}: {
  open: boolean; type: "create" | "update"; id?: number;
  accounts: MailAccountVO[];
  onClose: () => void; onSuccess: () => void;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (type === "update" && id) {
      setLoading(true);
      MailTemplateApi.getMailTemplate(id).then((data) => form.setFieldsValue(data)).finally(() => setLoading(false));
    } else {
      form.setFieldsValue({ status: CommonStatusEnum.ENABLE });
    }
  }, [open, type, id]);
  const submit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (type === "create") { await MailTemplateApi.createMailTemplate(values); message.success("新增成功"); }
      else { await MailTemplateApi.updateMailTemplate({ ...values, id }); message.success("修改成功"); }
      onSuccess();
    } finally { setLoading(false); }
  };
  return (
    <Modal open={open} title={type === "create" ? "新增邮件模板" : "修改邮件模板"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden width={720}>
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="name" label="模板名称" rules={[{ required: true, message: "模板名称不能为空" }]}><Input /></Form.Item>
        <Form.Item name="code" label="模板编码" rules={[{ required: true, message: "模板编码不能为空" }]}><Input /></Form.Item>
        <Form.Item name="accountId" label="发送账号" rules={[{ required: true, message: "发送账号不能为空" }]}>
          <Select options={accounts.map((a) => ({ label: a.mail, value: a.id }))} />
        </Form.Item>
        <Form.Item name="nickname" label="发送人名称"><Input /></Form.Item>
        <Form.Item name="title" label="模板标题" rules={[{ required: true, message: "模板标题不能为空" }]}><Input /></Form.Item>
        <Form.Item name="content" label="模板内容" rules={[{ required: true, message: "模板内容不能为空" }]}>
          <Input.TextArea rows={6} placeholder="例如：你好，{name}" />
        </Form.Item>
        <Form.Item name="status" label="开启状态" rules={[{ required: true }]}><Select options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} /></Form.Item>
        <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
      </Form>
    </Modal>
  );
}
