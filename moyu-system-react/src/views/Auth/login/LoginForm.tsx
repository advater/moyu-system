import { Button, Checkbox, Form, Input, Space } from "antd";
import { HomeOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd/es/form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import CaptchaField from "@/components/CaptchaField";

export default function LoginForm({
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
  initialValues: { tenantName?: string; account?: string; password?: string; rememberMe?: boolean };
  onFinish: (values: any) => void;
}) {
  const { t } = useTranslation();

  return (
    <Form
      name="login"
      form={form}
      onFinish={onFinish}
      autoComplete="off"
      initialValues={initialValues}
    >
      {tenantEnable ? (
        <Form.Item name="tenantName" rules={[{ required: true, message: t("login.tenantNamePlaceholder") }]}>
          <Input prefix={<HomeOutlined />} placeholder={t("login.tenantNamePlaceholder")} />
        </Form.Item>
      ) : null}
      <Form.Item name="account" rules={[{ required: true, message: t("login.usernamePlaceholder") }]}>
        <Input prefix={<UserOutlined />} placeholder={t("login.usernamePlaceholder")} />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: t("login.passwordPlaceholder") }]}>
        <Input prefix={<LockOutlined />} type="password" placeholder={t("login.passwordPlaceholder")} />
      </Form.Item>
      <CaptchaField enabled={captcha.enabled} image={captcha.image} onRefresh={captcha.refresh} />
      <Form.Item name="rememberMe" valuePropName="checked">
        <Checkbox>{t("login.remember")}</Checkbox>
      </Form.Item>
      <Form.Item>
        <Button block type="primary" htmlType="submit" loading={loading}>
          {loading ? t("common.loading") : t("login.login")}
        </Button>
      </Form.Item>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Link to="/password">{t("login.forgetPassword")}</Link>
        <Link to="/register">{t("login.register")}</Link>
      </Space>
    </Form>
  );
}
