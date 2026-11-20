import { useEffect, useState } from "react";
import { Form, Input, Modal, Select, message } from "antd";
import * as SmsChannelApi from "@/api/system/sms/smsChannel";
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from "@/utils/dict";
import { CommonStatusEnum } from "@/utils/constants";

export default function SmsChannelForm({
  open, type, id, onClose, onSuccess,
}: { open: boolean; type: "create" | "update"; id?: number; onClose: () => void; onSuccess: () => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (type === "update" && id) {
      setLoading(true);
      SmsChannelApi.getSmsChannel(id).then((data) => form.setFieldsValue(data)).finally(() => setLoading(false));
    } else {
      form.setFieldsValue({ status: CommonStatusEnum.ENABLE });
    }
  }, [open, type, id]);
  const submit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (type === "create") { await SmsChannelApi.createSmsChannel(values); message.success("新增成功"); }
      else { await SmsChannelApi.updateSmsChannel({ ...values, id }); message.success("修改成功"); }
      onSuccess();
    } finally { setLoading(false); }
  };
  return (
    <Modal open={open} title={type === "create" ? "新增短信渠道" : "修改短信渠道"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden>
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="signature" label="短信签名" rules={[{ required: true, message: "短信签名不能为空" }]}><Input /></Form.Item>
        <Form.Item name="code" label="渠道编码" rules={[{ required: true, message: "渠道编码不能为空" }]}>
          <Select options={getStrDictOptions(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE)} />
        </Form.Item>
        <Form.Item name="status" label="启用状态" rules={[{ required: true }]}>
          <Select options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} />
        </Form.Item>
        <Form.Item name="apiKey" label="短信 API 账号" rules={[{ required: true, message: "短信 API 账号不能为空" }]}><Input /></Form.Item>
        <Form.Item name="apiSecret" label="短信 API 密钥"><Input.Password /></Form.Item>
        <Form.Item name="callbackUrl" label="短信回调 URL"><Input /></Form.Item>
        <Form.Item name="remark" label="备注"><Input.TextArea rows={3} /></Form.Item>
      </Form>
    </Modal>
  );
}
