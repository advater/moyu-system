import { useEffect, useState } from "react";
import { usePendingOpen } from "@/hooks/usePendingOpen";
import { Form, Input, Modal, Select, message } from "antd";
import type { UserVO } from "@/api/system/user";
import * as RoleApi from "@/api/system/role";
import * as PermissionApi from "@/api/system/permission";

export default function AssignRoleForm({
  open,
  user,
  onClose,
  onSuccess,
}: {
  open: boolean;
  user: UserVO | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form] = Form.useForm();
  const pendingKey = open && user ? String(user.id) : null;
  const { loading, setSubmitting, completePending } = usePendingOpen(pendingKey);
  const [roleList, setRoleList] = useState<RoleApi.RoleVO[]>([]);

  useEffect(() => {
    if (!open || !user) return;
    form.setFieldsValue({ username: user.username, nickname: user.nickname, roleIds: [] });
    const key = String(user.id);
    let cancelled = false;
    Promise.all([RoleApi.getSimpleRoleList(), PermissionApi.getUserRoleList(user.id)])
      .then(([roles, roleIds]) => {
        if (cancelled) return;
        setRoleList(roles || []);
        form.setFieldsValue({ roleIds: roleIds || [] });
      })
      .finally(() => { if (!cancelled) completePending(key); });
    return () => { cancelled = true; };
  }, [open, user, completePending]);

  const submit = async () => {
    if (!user) return;
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await PermissionApi.assignUserRole({ userId: user.id, roleIds: values.roleIds || [] });
      message.success("修改成功");
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="分配角色" onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden>
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="username" label="用户名称">
          <Input disabled />
        </Form.Item>
        <Form.Item name="nickname" label="用户昵称">
          <Input disabled />
        </Form.Item>
        <Form.Item name="roleIds" label="角色">
          <Select
            mode="multiple"
            placeholder="请选择角色"
            options={roleList.map((item) => ({ label: item.name, value: item.id }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
