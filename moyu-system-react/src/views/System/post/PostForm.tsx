import { useEffect } from "react";
import { usePendingOpen } from "@/hooks/usePendingOpen";
import { Form, Input, InputNumber, Modal, Select, message } from "antd";
import * as PostApi from "@/api/system/post";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import { CommonStatusEnum } from "@/utils/constants";

export default function PostForm({
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
      PostApi.getPost(id).then((data) => form.setFieldsValue(data)).finally(() => { if (!cancelled) completePending(key); });
      return () => { cancelled = true; };
    } else {
      form.setFieldsValue({ status: CommonStatusEnum.ENABLE, sort: 0 });
    }
  }, [open, type, id, completePending]);

  const submit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (type === "create") { await PostApi.createPost(values); message.success("新增成功"); }
      else { await PostApi.updatePost({ ...values, id }); message.success("修改成功"); }
      onSuccess();
    } finally { setSubmitting(false); }
  };

  return (
    <Modal open={open} title={type === "create" ? "新增岗位" : "修改岗位"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden>
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="name" label="岗位标题" rules={[{ required: true, message: "岗位标题不能为空" }]}><Input /></Form.Item>
        <Form.Item name="code" label="岗位编码" rules={[{ required: true, message: "岗位编码不能为空" }]}><Input /></Form.Item>
        <Form.Item name="sort" label="岗位顺序"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true }]}><Select options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} /></Form.Item>
        <Form.Item name="remark" label="备注"><Input.TextArea rows={3} /></Form.Item>
      </Form>
    </Modal>
  );
}
