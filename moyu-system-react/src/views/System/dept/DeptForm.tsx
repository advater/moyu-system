import { useEffect, useState } from "react";
import { usePendingOpen } from "@/hooks/usePendingOpen";
import { Form, Input, InputNumber, Modal, Select, TreeSelect, message } from "antd";
import * as DeptApi from "@/api/system/dept";
import * as UserApi from "@/api/system/user";
import { handleTree } from "@/utils/tree";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import { CommonStatusEnum } from "@/utils/constants";

export default function DeptForm({
  open, type, id, parentId, onClose, onSuccess,
}: { open: boolean; type: "create" | "update"; id?: number; parentId?: number; onClose: () => void; onSuccess: () => void }) {
  const [form] = Form.useForm();
  const pendingKey = open && type === "update" && id ? String(id) : null;
  const { loading, setSubmitting, completePending } = usePendingOpen(pendingKey);
  const [deptTree, setDeptTree] = useState<any[]>([]);
  const [userList, setUserList] = useState<UserApi.UserVO[]>([]);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    Promise.all([DeptApi.getSimpleDeptList(), UserApi.getSimpleUserList()]).then(([depts, users]) => {
      setDeptTree([{ id: 0, name: "顶级部门", children: handleTree(depts || []) }]);
      setUserList(users || []);
    });
    if (type === "update" && id) {
      const key = String(id);
      let cancelled = false;
      DeptApi.getDept(id).then((data) => form.setFieldsValue(data)).finally(() => { if (!cancelled) completePending(key); });
      return () => { cancelled = true; };
    } else {
      form.setFieldsValue({ parentId: parentId ?? 0, status: CommonStatusEnum.ENABLE, sort: 0 });
    }
  }, [open, type, id, parentId, completePending]);

  const submit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (type === "create") {
        await DeptApi.createDept(values);
        message.success("新增成功");
      } else {
        await DeptApi.updateDept({ ...values, id });
        message.success("修改成功");
      }
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title={type === "create" ? "新增部门" : "修改部门"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden>
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="parentId" label="上级部门" rules={[{ required: true, message: "上级部门不能为空" }]}>
          <TreeSelect treeData={deptTree} fieldNames={{ label: "name", value: "id", children: "children" }} treeDefaultExpandAll />
        </Form.Item>
        <Form.Item name="name" label="部门名称" rules={[{ required: true, message: "部门名称不能为空" }]}>
          <Input placeholder="请输入部门名称" />
        </Form.Item>
        <Form.Item name="sort" label="显示排序" rules={[{ required: true, message: "显示排序不能为空" }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="leaderUserId" label="负责人">
          <Select allowClear placeholder="请选择负责人" options={userList.map((u) => ({ label: u.nickname, value: u.id }))} />
        </Form.Item>
        <Form.Item name="phone" label="联系电话" rules={[{ pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号码" }]}>
          <Input maxLength={11} />
        </Form.Item>
        <Form.Item name="email" label="邮箱" rules={[{ type: "email", message: "请输入正确的邮箱地址" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true }]}>
          <Select options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
