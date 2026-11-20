import { useEffect, useState } from "react";
import { Form, Input, Modal, Select, message } from "antd";
import * as NotifyTemplateApi from "@/api/system/notify/template";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import { CommonStatusEnum } from "@/utils/constants";

export default function NotifyTemplateForm({
  open, type, id, onClose, onSuccess,
}: { open: boolean; type: "create" | "update"; id?: number; onClose: () => void; onSuccess: () => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (type === "update" && id) {
      setLoading(true);
      NotifyTemplateApi.getNotifyTemplate(id).then((data) => form.setFieldsValue(data)).finally(() => setLoading(false));
    } else {
      form.setFieldsValue({ status: CommonStatusEnum.ENABLE, type: 1 });
    }
  }, [open, type, id]);
  const submit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (type === "create") { await NotifyTemplateApi.createNotifyTemplate(values); message.success("新增成功"); }
      else { await NotifyTemplateApi.updateNotifyTemplate({ ...values, id }); message.success("修改成功"); }
      onSuccess();
    } finally { setLoading(false); }
  };
  return (
    <Modal open={open} title={type === "create" ? "新增站内信模板" : "修改站内信模板"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden width={640}>
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="name" label="模板名称" rules={[{ required: true, message: "模板名称不能为空" }]}><Input /></Form.Item>
        <Form.Item name="code" label="模板编码" rules={[{ required: true, message: "模板编码不能为空" }]}><Input /></Form.Item>
        <Form.Item name="type" label="模板类型" rules={[{ required: true }]}><Select options={getIntDictOptions(DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE)} /></Form.Item>
        <Form.Item name="nickname" label="发送人名称" rules={[{ required: true, message: "发送人名称不能为空" }]}><Input /></Form.Item>
        <Form.Item name="content" label="模板内容" rules={[{ required: true, message: "模板内容不能为空" }]}>
          <Input.TextArea rows={5} placeholder="例如：您的订单 {orderId} 已发货" />
        </Form.Item>
        <Form.Item name="status" label="开启状态" rules={[{ required: true }]}><Select options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} /></Form.Item>
        <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
      </Form>
    </Modal>
  );
}
