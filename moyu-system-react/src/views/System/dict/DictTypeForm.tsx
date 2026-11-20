import { useEffect, useState } from "react";
import { Form, Input, Modal, Radio, message } from "antd";
import * as DictTypeApi from "@/api/system/dict/dict.type";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import { CommonStatusEnum } from "@/utils/constants";

export default function DictTypeForm({
  open, type, id, onClose, onSuccess,
}: { open: boolean; type: "create" | "update"; id?: number; onClose: () => void; onSuccess: () => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (type === "update" && id) {
      setLoading(true);
      DictTypeApi.getDictType(id).then((data) => form.setFieldsValue(data)).finally(() => setLoading(false));
    } else {
      form.setFieldsValue({ status: CommonStatusEnum.ENABLE });
    }
  }, [open, type, id]);

  const submit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (type === "create") { await DictTypeApi.createDictType(values); message.success("新增成功"); }
      else { await DictTypeApi.updateDictType({ ...values, id }); message.success("修改成功"); }
      onSuccess();
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} title={type === "create" ? "新增字典类型" : "修改字典类型"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden>
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="name" label="字典名称" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="type" label="字典类型" rules={[{ required: true }]}><Input disabled={type === "update"} /></Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true }]}>
          <Radio.Group options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} />
        </Form.Item>
        <Form.Item name="remark" label="备注"><Input.TextArea rows={3} /></Form.Item>
      </Form>
    </Modal>
  );
}
