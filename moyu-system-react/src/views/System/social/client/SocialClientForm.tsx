import { useEffect, useState } from "react";
import { Form, Input, Modal, Select, message } from "antd";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import { CommonStatusEnum } from "@/utils/constants";
import * as SocialClientApi from "@/api/system/social/client";

export default function SocialClientForm({
  open, type, id, onClose, onSuccess,
}: { open: boolean; type: "create" | "update"; id?: number; onClose: () => void; onSuccess: () => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const socialType = Form.useWatch("socialType", form);
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (type === "update" && id) {
      setLoading(true);
      SocialClientApi.getSocialClient(id).then((data) => form.setFieldsValue({ ...data, clientSecret: undefined })).finally(() => setLoading(false));
    } else {
      form.setFieldsValue({ status: CommonStatusEnum.ENABLE, userType: 2, agentId: "0" });
    }
  }, [open, type, id]);
  const submit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const payload = { ...values, agentId: values.agentId || "0" };
      if (type === "create") { await SocialClientApi.createSocialClient(payload); message.success("新增成功"); }
      else { await SocialClientApi.updateSocialClient({ ...payload, id }); message.success("修改成功"); }
      onSuccess();
    } finally { setLoading(false); }
  };
  return (
    <Modal open={open} title={type === "create" ? "新增社交客户端" : "修改社交客户端"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden>
      <Form form={form} labelCol={{ span: 7 }} wrapperCol={{ span: 15 }}>
        <Form.Item name="name" label="应用名" rules={[{ required: true, message: "应用名不能为空" }]}><Input /></Form.Item>
        <Form.Item name="socialType" label="社交平台" rules={[{ required: true }]}><Select options={getIntDictOptions(DICT_TYPE.SYSTEM_SOCIAL_TYPE)} /></Form.Item>
        <Form.Item name="userType" label="用户类型" rules={[{ required: true }]}><Select options={getIntDictOptions(DICT_TYPE.USER_TYPE)} /></Form.Item>
        <Form.Item name="clientId" label="客户端编号" rules={[{ required: true, message: "客户端编号不能为空" }]}><Input /></Form.Item>
        <Form.Item name="clientSecret" label="客户端密钥" rules={type === "create" ? [{ required: true, message: "客户端密钥不能为空" }] : []}>
          <Input.Password placeholder={type === "update" ? "不修改请留空" : ""} />
        </Form.Item>
        {socialType === 30 && <Form.Item name="agentId" label="agentId"><Input /></Form.Item>}
        {socialType === 40 && <Form.Item name="publicKey" label="公钥"><Input.TextArea rows={3} /></Form.Item>}
        <Form.Item name="status" label="状态" rules={[{ required: true }]}><Select options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} /></Form.Item>
      </Form>
    </Modal>
  );
}
