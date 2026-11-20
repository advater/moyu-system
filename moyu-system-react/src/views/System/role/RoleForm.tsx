import { useEffect, useState } from "react";
import { Form, Input, InputNumber, Modal, Select, message } from "antd";
import * as RoleApi from "@/api/system/role";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import { CommonStatusEnum, SystemRoleTypeEnum } from "@/utils/constants";

export default function RoleForm({
  open, type, id, onClose, onSuccess,
}: { open: boolean; type: "create" | "update"; id?: number; onClose: () => void; onSuccess: () => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [builtin, setBuiltin] = useState(false);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setBuiltin(false);
    if (type === "update" && id) {
      setLoading(true);
      RoleApi.getRole(id).then((data) => {
        form.setFieldsValue(data);
        setBuiltin(data.type === SystemRoleTypeEnum.SYSTEM);
      }).finally(() => setLoading(false));
    } else {
      form.setFieldsValue({ status: CommonStatusEnum.ENABLE, sort: 0 });
    }
  }, [open, type, id]);

  const submit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (type === "create") {
        await RoleApi.createRole(values);
        message.success("新增成功");
      } else {
        await RoleApi.updateRole({ ...values, id });
        message.success("修改成功");
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title={type === "create" ? "新增角色" : "修改角色"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden>
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="name" label="角色名称" rules={[{ required: true, message: "角色名称不能为空" }]}>
          <Input placeholder="请输入角色名称" />
        </Form.Item>
        <Form.Item name="code" label="角色标识" rules={[{ required: true, message: "角色标识不能为空" }]}>
          <Input placeholder="请输入角色标识" />
        </Form.Item>
        <Form.Item name="sort" label="显示顺序" rules={[{ required: true, message: "显示顺序不能为空" }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="status" hidden={builtin} label="状态" rules={[{ required: true, message: "状态不能为空" }]}>
          <Select options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
