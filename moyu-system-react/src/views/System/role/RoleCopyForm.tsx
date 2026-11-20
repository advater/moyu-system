import { useEffect, useState } from "react";
import { Form, Input, Modal, message } from "antd";
import * as RoleApi from "@/api/system/role";
import type { RoleVO } from "@/api/system/role";

export default function RoleCopyForm({
  open,
  role,
  onClose,
  onSuccess,
}: {
  open: boolean;
  role: RoleVO | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !role) return;
    form.setFieldsValue({
      name: `${role.name} 副本`,
      code: `${role.code}_copy`,
    });
  }, [open, role, form]);

  const submit = async () => {
    if (!role?.id) return;
    const values = await form.validateFields();
    setLoading(true);
    try {
      await RoleApi.copyRole({ id: role.id, name: values.name, code: values.code });
      message.success("复制成功");
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title="复制角色" onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden>
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="name" label="新角色名称" rules={[{ required: true, message: "请输入角色名称" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="code" label="新角色标识" rules={[{ required: true, message: "请输入角色标识" }]}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
