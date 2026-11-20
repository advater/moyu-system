import { useEffect } from "react";
import { usePendingOpen } from "@/hooks/usePendingOpen";
import { Form, Input, InputNumber, Modal, Radio, Select, message } from "antd";
import * as DictDataApi from "@/api/system/dict/dict.data";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import { CommonStatusEnum } from "@/utils/constants";

const colorTypeOptions = [
  { label: "默认(default)", value: "" },
  { label: "主要(primary)", value: "primary" },
  { label: "成功(success)", value: "success" },
  { label: "信息(info)", value: "info" },
  { label: "警告(warning)", value: "warning" },
  { label: "危险(danger)", value: "danger" },
];

export default function DictDataForm({
  open, type, id, dictType, onClose, onSuccess,
}: { open: boolean; type: "create" | "update"; id?: number; dictType: string; onClose: () => void; onSuccess: () => void }) {
  const [form] = Form.useForm();
  const pendingKey = open && type === "update" && id ? String(id) : null;
  const { loading, setSubmitting, completePending } = usePendingOpen(pendingKey);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (type === "update" && id) {
      const key = String(id);
      let cancelled = false;
      DictDataApi.getDictData(id).then((data) => form.setFieldsValue(data)).finally(() => { if (!cancelled) completePending(key); });
      return () => { cancelled = true; };
    } else {
      form.setFieldsValue({ dictType, status: CommonStatusEnum.ENABLE, sort: 0 });
    }
  }, [open, type, id, dictType, completePending]);

  const submit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (type === "create") { await DictDataApi.createDictData(values); message.success("新增成功"); }
      else { await DictDataApi.updateDictData({ ...values, id }); message.success("修改成功"); }
      onSuccess();
    } finally { setSubmitting(false); }
  };

  return (
    <Modal open={open} title={type === "create" ? "新增字典数据" : "修改字典数据"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden>
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="dictType" label="字典类型"><Input disabled /></Form.Item>
        <Form.Item name="label" label="数据标签" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="value" label="数据键值" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="sort" label="显示排序"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true }]}>
          <Radio.Group options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} />
        </Form.Item>
        <Form.Item name="colorType" label="颜色类型">
          <Select allowClear options={colorTypeOptions} />
        </Form.Item>
        <Form.Item name="cssClass" label="CSS Class"><Input /></Form.Item>
        <Form.Item name="remark" label="备注"><Input.TextArea rows={3} /></Form.Item>
      </Form>
    </Modal>
  );
}
