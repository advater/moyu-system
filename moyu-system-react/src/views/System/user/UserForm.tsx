import { useEffect, useState } from "react";
import { Form, Input, Modal, Select, TreeSelect, message } from "antd";
import * as UserApi from "@/api/system/user";
import * as DeptApi from "@/api/system/dept";
import * as PostApi from "@/api/system/post";
import { handleTree } from "@/utils/tree";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import { CommonStatusEnum } from "@/utils/constants";

export default function UserForm({
  open,
  type,
  id,
  onClose,
  onSuccess,
}: {
  open: boolean;
  type: "create" | "update";
  id?: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [deptTree, setDeptTree] = useState<any[]>([]);
  const [postList, setPostList] = useState<PostApi.PostVO[]>([]);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    Promise.all([DeptApi.getSimpleDeptList(), PostApi.getSimplePostList()])
      .then(([depts, posts]) => {
        setDeptTree(handleTree(depts || []));
        setPostList(posts || []);
      })
      .catch(() => {});
    if (type === "update" && id) {
      setLoading(true);
      UserApi.getUser(id)
        .then((data) => form.setFieldsValue(data))
        .finally(() => setLoading(false));
    } else {
      form.setFieldsValue({ status: CommonStatusEnum.ENABLE });
    }
  }, [open, type, id]);

  const submit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (type === "create") {
        await UserApi.createUser(values);
        message.success("新增成功");
      } else {
        await UserApi.updateUser({ ...values, id });
        message.success("修改成功");
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={type === "create" ? "新增用户" : "修改用户"}
      onCancel={onClose}
      onOk={submit}
      confirmLoading={loading}
      destroyOnHidden
      width={720}
    >
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="nickname" label="用户昵称" rules={[{ required: true, message: "用户昵称不能为空" }]}>
          <Input placeholder="请输入用户昵称" />
        </Form.Item>
        <Form.Item name="deptId" label="归属部门">
          <TreeSelect
            placeholder="请选择归属部门"
            treeData={deptTree}
            fieldNames={{ label: "name", value: "id", children: "children" }}
            allowClear
            treeDefaultExpandAll
          />
        </Form.Item>
        <Form.Item name="mobile" label="手机号码" rules={[{ pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号码" }]}>
          <Input placeholder="请输入手机号码" maxLength={11} />
        </Form.Item>
        <Form.Item name="email" label="邮箱" rules={[{ type: "email", message: "请输入正确的邮箱地址" }]}>
          <Input placeholder="请输入邮箱" />
        </Form.Item>
        {type === "create" && (
          <>
            <Form.Item name="username" label="用户名称" rules={[{ required: true, message: "用户名称不能为空" }]}>
              <Input placeholder="请输入用户名称" />
            </Form.Item>
            <Form.Item name="password" label="用户密码" rules={[{ required: true, message: "用户密码不能为空" }]}>
              <Input.Password placeholder="请输入用户密码" />
            </Form.Item>
          </>
        )}
        <Form.Item name="sex" label="用户性别">
          <Select placeholder="请选择" allowClear options={getIntDictOptions(DICT_TYPE.SYSTEM_USER_SEX)} />
        </Form.Item>
        <Form.Item name="postIds" label="岗位">
          <Select
            mode="multiple"
            placeholder="请选择"
            allowClear
            options={postList.map((item) => ({ label: item.name, value: item.id }))}
          />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea placeholder="请输入内容" rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
