import { Button, Form, Input, Space } from "antd";
import { HomeOutlined, LockOutlined, PhoneOutlined, SafetyOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd/es/form";
import { Link } from "react-router-dom";
import CaptchaField from "@/components/CaptchaField";

export default function PasswordForm({
  form,
  loading,
  smsLoading,
  countdown,
  tenantEnable,
  captcha,
  initialValues,
  onFinish,
  onSendSms,
}: {
  form: FormInstance;
  loading: boolean;
  smsLoading: boolean;
  countdown: number;
  tenantEnable: boolean;
  captcha: { enabled: boolean; image: string; refresh: () => void };
  initialValues?: { tenantName?: string };
  onFinish: (values: any) => void;
  onSendSms: () => void;
}) {
  return (
    <Form name="password" form={form} onFinish={onFinish} autoComplete="off" initialValues={initialValues}>
      {tenantEnable ? (
        <Form.Item name="tenantName" rules={[{ required: true, message: "请输入租户名称" }]}>
          <Input prefix={<HomeOutlined />} placeholder="请输入租户名称" />
        </Form.Item>
      ) : null}
      <Form.Item
        name="mobile"
        rules={[
          { required: true, message: "请输入手机号" },
          { pattern: /^1[3-9]\d{9}$/, message: "请输入有效的手机号" },
        ]}
      >
        <Input prefix={<PhoneOutlined />} placeholder="请输入绑定手机号" />
      </Form.Item>
      <CaptchaField enabled={captcha.enabled} image={captcha.image} onRefresh={captcha.refresh} />
      <Form.Item label="短信验证码" required>
        <Space.Compact style={{ width: "100%" }}>
          <Form.Item name="code" noStyle rules={[{ required: true, message: "请输入短信验证码" }]}>
            <Input prefix={<SafetyOutlined />} placeholder="短信验证码" maxLength={6} />
          </Form.Item>
          <Button disabled={countdown > 0} loading={smsLoading} onClick={onSendSms}>
            {countdown > 0 ? `${countdown}s` : "获取验证码"}
          </Button>
        </Space.Compact>
      </Form.Item>
      <Form.Item
        name="password"
        rules={[
          { required: true, message: "请输入新密码" },
          { min: 6, max: 32, message: "密码长度为 6-32 位" },
        ]}
      >
        <Input prefix={<LockOutlined />} type="password" placeholder="请输入新密码" />
      </Form.Item>
      <Form.Item
        name="rePassword"
        dependencies={["password"]}
        rules={[
          { required: true, message: "请再次输入新密码" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) return Promise.resolve();
              return Promise.reject(new Error("两次输入的密码不一致"));
            },
          }),
        ]}
      >
        <Input prefix={<LockOutlined />} type="password" placeholder="请再次输入新密码" />
      </Form.Item>
      <Form.Item>
        <Button block type="primary" htmlType="submit" loading={loading}>
          {loading ? "重置中..." : "重置密码"}
        </Button>
      </Form.Item>
      <Link to="/login">返回登录</Link>
    </Form>
  );
}
