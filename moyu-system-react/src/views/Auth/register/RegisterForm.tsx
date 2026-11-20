import { Button, Form, Input } from "antd";
import { HomeOutlined, LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd/es/form";
import { Link } from "react-router-dom";
import CaptchaField from "@/components/CaptchaField";

export default function RegisterForm({
  form,
  loading,
  tenantEnable,
  captcha,
  initialValues,
  onFinish,
}: {
  form: FormInstance;
  loading: boolean;
  tenantEnable: boolean;
  captcha: { enabled: boolean; image: string; refresh: () => void };
  initialValues?: { tenantName?: string };
  onFinish: (values: any) => void;
}) {
  return (
    <Form name="register" form={form} onFinish={onFinish} autoComplete="off" initialValues={initialValues}>
      {tenantEnable ? (
        <Form.Item name="tenantName" rules={[{ required: true, message: "请输入租户名称" }]}>
          <Input prefix={<HomeOutlined />} placeholder="请输入租户名称" />
        </Form.Item>
      ) : null}
      <Form.Item name="account" rules={[{ required: true, message: "请输入账号" }, { min: 4, max: 30, message: "账号长度为 4-30 位" }]}>
        <Input prefix={<UserOutlined />} placeholder="请输入账号" />
      </Form.Item>
      <Form.Item
        name="email"
        rules={[
          { required: true, message: "请输入邮箱" },
          { type: "email", message: "请输入有效的邮箱地址" },
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
      </Form.Item>
      <Form.Item
        name="phone"
        rules={[
          { required: true, message: "请输入手机号" },
          { pattern: /^1[3-9]\d{9}$/, message: "请输入有效的手机号" },
        ]}
      >
        <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[
          { required: true, message: "请输入密码" },
          { min: 6, max: 32, message: "密码长度为 6-32 位" },
        ]}
      >
        <Input prefix={<LockOutlined />} type="password" placeholder="请输入密码" />
      </Form.Item>
      <Form.Item
        name="rePassword"
        dependencies={["password"]}
        rules={[
          { required: true, message: "请再次输入密码" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) return Promise.resolve();
              return Promise.reject(new Error("两次输入的密码不一致"));
            },
          }),
        ]}
      >
        <Input prefix={<LockOutlined />} type="password" placeholder="请再次输入密码" />
      </Form.Item>
      <CaptchaField enabled={captcha.enabled} image={captcha.image} onRefresh={captcha.refresh} />
      <Form.Item>
        <Button block type="primary" htmlType="submit" loading={loading}>
          {loading ? "注册中..." : "注册"}
        </Button>
      </Form.Item>
      <Link to="/login">已有账号？去登录</Link>
    </Form>
  );
}
