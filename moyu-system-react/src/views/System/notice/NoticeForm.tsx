import { useEffect, useState } from "react";
import { Form, Input, Modal, Select, message } from "antd";
import * as NoticeApi from "@/api/system/notice";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import { CommonStatusEnum } from "@/utils/constants";

export default function NoticeForm({
  open, type, id, onClose, onSuccess,
}: { open: boolean; type: "create" | "update"; id?: number; onClose: () => void; onSuccess: () => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (type === "update" && id) {
      setLoading(true);
      NoticeApi.getNotice(id).then((data) => form.setFieldsValue(data)).finally(() => setLoading(false));
    } else {
      form.setFieldsValue({ status: CommonStatusEnum.ENABLE });
    }
  }, [open, type, id]);

  const submit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (type === "create") { await NoticeApi.createNotice(values); message.success("新增成功"); }
      else { await NoticeApi.updateNotice({ ...values, id }); message.success("修改成功"); }
      onSuccess();
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} title={type === "create" ? "新增公告" : "修改公告"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden width={720}>
      <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 17 }}>
        <Form.Item name="title" label="公告标题" rules={[{ required: true, message: "公告标题不能为空" }]}><Input /></Form.Item>
        <Form.Item name="content" label="公告内容" rules={[{ required: true, message: "公告内容不能为空" }]}>
          <Input.TextArea rows={6} />
        </Form.Item>
        <Form.Item name="type" label="公告类型" rules={[{ required: true, message: "公告类型不能为空" }]}>
          <Select options={getIntDictOptions(DICT_TYPE.SYSTEM_NOTICE_TYPE)} />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true }]}>
          <Select options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} />
        </Form.Item>
        <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
      </Form>
    </Modal>
  );
}
