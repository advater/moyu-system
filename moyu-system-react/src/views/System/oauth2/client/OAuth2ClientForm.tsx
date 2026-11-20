import { useEffect } from "react";
import { usePendingOpen } from "@/hooks/usePendingOpen";
import { Form, Input, InputNumber, Modal, Select, message } from "antd";
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from "@/utils/dict";
import { CommonStatusEnum } from "@/utils/constants";
import * as ClientApi from "@/api/system/oauth2/client";

export default function OAuth2ClientForm({
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
      ClientApi.getOAuth2Client(id).then((data) => form.setFieldsValue({ ...data, secret: undefined })).finally(() => { if (!cancelled) completePending(key); });
      return () => { cancelled = true; };
    } else {
      form.setFieldsValue({
        status: CommonStatusEnum.ENABLE,
        accessTokenValiditySeconds: 1800,
        refreshTokenValiditySeconds: 2592000,
        authorizedGrantTypes: ["password", "refresh_token"],
      });
    }
  }, [open, type, id, completePending]);
  const submit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (type === "create") { await ClientApi.createOAuth2Client(values); message.success("新增成功"); }
      else { await ClientApi.updateOAuth2Client({ ...values, id }); message.success("修改成功"); }
      onSuccess();
    } finally { setSubmitting(false); }
  };
  return (
    <Modal open={open} title={type === "create" ? "新增 OAuth2 客户端" : "修改 OAuth2 客户端"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden width={720}>
      <Form form={form} labelCol={{ span: 8 }} wrapperCol={{ span: 14 }}>
        <Form.Item name="clientId" label="客户端编号" rules={[{ required: true, message: "客户端编号不能为空" }]}><Input /></Form.Item>
        <Form.Item name="secret" label="客户端密钥" rules={type === "create" ? [{ required: true, message: "客户端密钥不能为空" }] : []}>
          <Input.Password placeholder={type === "update" ? "不修改请留空" : ""} />
        </Form.Item>
        <Form.Item name="name" label="应用名" rules={[{ required: true, message: "应用名不能为空" }]}><Input /></Form.Item>
        <Form.Item name="logo" label="应用图标" rules={[{ required: true, message: "应用图标不能为空" }]}><Input /></Form.Item>
        <Form.Item name="description" label="应用描述"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true }]}><Select options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} /></Form.Item>
        <Form.Item name="accessTokenValiditySeconds" label="访问令牌有效期" rules={[{ required: true }]}><InputNumber min={1} addonAfter="秒" style={{ width: "100%" }} /></Form.Item>
        <Form.Item name="refreshTokenValiditySeconds" label="刷新令牌有效期" rules={[{ required: true }]}><InputNumber min={1} addonAfter="秒" style={{ width: "100%" }} /></Form.Item>
        <Form.Item name="authorizedGrantTypes" label="授权类型" rules={[{ required: true, message: "授权类型不能为空" }]}>
          <Select mode="multiple" options={getStrDictOptions(DICT_TYPE.SYSTEM_OAUTH2_GRANT_TYPE)} />
        </Form.Item>
        <Form.Item name="redirectUris" label="可重定向 URI"><Select mode="tags" placeholder="输入后回车" /></Form.Item>
        <Form.Item name="scopes" label="授权范围"><Select mode="tags" placeholder="输入后回车" /></Form.Item>
        <Form.Item name="autoApproveScopes" label="自动授权范围"><Select mode="tags" placeholder="输入后回车" /></Form.Item>
        <Form.Item name="authorities" label="权限"><Select mode="tags" placeholder="输入后回车" /></Form.Item>
        <Form.Item name="resourceIds" label="资源"><Select mode="tags" placeholder="输入后回车" /></Form.Item>
        <Form.Item name="additionalInformation" label="附加信息"><Input.TextArea rows={2} /></Form.Item>
      </Form>
    </Modal>
  );
}
