import { useEffect, useState } from "react";
import { Form, message } from "antd";
import { useNavigate } from "react-router-dom";
import { postRegister, getTenantByWebsite } from "@/api/login";
import { bootstrapSession, setLogin } from "@/utils/auth";
import { setMustChangePassword } from "@/utils/mustChangePassword";
import { isCaptchaRequiredError, useCaptcha } from "@/hooks/useCaptcha";
import { env } from "@/config/env";

export function useRegister() {
  const [messageApi, messageHolder] = message.useMessage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [forceCaptcha, setForceCaptcha] = useState(false);
  const [form] = Form.useForm();
  const captcha = useCaptcha(forceCaptcha);

  useEffect(() => {
    if (!env.tenantEnable) return;
    getTenantByWebsite(window.location.host)
      .then((res) => {
        if (res?.name) form.setFieldsValue({ tenantName: res.name });
      })
      .catch(() => {});
  }, [form]);

  const handleRegister = async (values: any) => {
    const { tenantName, account, email, phone, password, captchaCode } = values;
    try {
      setLoading(true);
      const loginData = await postRegister({
        username: account,
        nickname: account,
        password,
        email,
        phone,
        tenantName: env.tenantEnable ? tenantName : undefined,
        captchaUuid: captcha.enabled ? captcha.uuid : undefined,
        captchaCode: captcha.enabled ? captchaCode : undefined,
      });
      if (loginData?.accessToken) {
        setLogin({ token: loginData.accessToken, refreshToken: loginData.refreshToken });
        setMustChangePassword(!!loginData.mustChangePassword);
        await bootstrapSession();
        navigate(loginData.mustChangePassword ? "/profile" : "/");
        return;
      }
      messageApi.success("注册成功");
      form.resetFields();
      setTimeout(() => navigate("/login"), 1200);
    } catch (error: any) {
      if (isCaptchaRequiredError(error)) setForceCaptcha(true);
      void captcha.refresh();
      form.setFieldValue("captchaCode", "");
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    captcha,
    tenantEnable: env.tenantEnable,
    messageHolder,
    handleRegister,
    initialValues: {
      tenantName: env.defaultLogin.tenantName || "默认租户",
    },
  };
}
