import { useEffect, useState } from "react";
import { Form, message } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { login, getTenantByWebsite } from "@/api/login";
import Token from "@/utils/token";
import { bootstrapSession, setLogin, setTenantId } from "@/utils/auth";
import { setMustChangePassword } from "@/utils/mustChangePassword";
import { isCaptchaRequiredError, useCaptcha } from "@/hooks/useCaptcha";
import { env } from "@/config/env";

export function useLogin() {
  const { t } = useTranslation();
  const [messageApi, messageHolder] = message.useMessage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [forceCaptcha, setForceCaptcha] = useState(false);
  const [form] = Form.useForm();
  const captcha = useCaptcha(forceCaptcha);

  const handleLogin = async (values: any) => {
    const { tenantName, account, password, rememberMe, captchaCode } = values;
    if (!account) {
      messageApi.error(t("login.usernamePlaceholder"));
      return;
    }
    if (!password) {
      messageApi.error(t("login.passwordPlaceholder"));
      return;
    }

    try {
      setLoading(true);
      const loginData = await login({
        username: account,
        password,
        tenantName: env.tenantEnable ? tenantName : undefined,
        rememberMe,
        captchaUuid: captcha.enabled ? captcha.uuid : undefined,
        captchaCode: captcha.enabled ? captchaCode : undefined,
      });
      setLogin({ token: loginData.accessToken, refreshToken: loginData.refreshToken });
      setMustChangePassword(!!loginData.mustChangePassword);
      await bootstrapSession();
      form.resetFields(["password", "captchaCode"]);
      navigate(
        loginData.mustChangePassword
          ? "/profile"
          : searchParams.get("redirect") || "/",
      );
    } catch (error: any) {
      if (isCaptchaRequiredError(error)) setForceCaptcha(true);
      void captcha.refresh();
      form.setFieldsValue({ password: "", captchaCode: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Token.getToken()) {
      navigate("/");
      return;
    }
    if (!env.tenantEnable) return;
    getTenantByWebsite(window.location.host)
      .then((res) => {
        if (res?.name) {
          form.setFieldsValue({ tenantName: res.name });
          if (res.id != null) setTenantId(res.id);
        }
      })
      .catch(() => {});
  }, [form, navigate]);

  return {
    form,
    loading,
    messageHolder,
    handleLogin,
    tenantEnable: env.tenantEnable,
    captcha,
    initialValues: {
      tenantName: env.defaultLogin.tenantName || "默认租户",
      account: env.defaultLogin.username,
      password: env.defaultLogin.password,
      rememberMe: true,
    },
  };
}
