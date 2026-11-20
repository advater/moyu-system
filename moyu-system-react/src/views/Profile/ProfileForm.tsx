import { Button, Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";

export default function ProfileForm({
  form,
  loading,
  onSubmit,
}: {
  form: FormInstance;
  loading: boolean;
  onSubmit: () => void;
}) {
  return (
    <Form form={form} labelCol={{ span: 4 }} wrapperCol={{ span: 10 }}>
      <Form.Item label="账号" name="username">
        <Input disabled />
      </Form.Item>
      <Form.Item label="昵称" name="nickname" rules={[{ required: true, message: "请输入昵称" }]}>
        <Input />
      </Form.Item>
      <Form.Item label="邮箱" name="email">
        <Input />
      </Form.Item>
      <Form.Item label="手机号" name="mobile">
        <Input />
      </Form.Item>
      <Form.Item label="性别" name="sex">
        <Select
          allowClear
          options={[
            { label: "男", value: 1 },
            { label: "女", value: 2 },
          ]}
        />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 4 }}>
        <Button type="primary" onClick={onSubmit} loading={loading}>
          保存修改
        </Button>
      </Form.Item>
    </Form>
  );
}
