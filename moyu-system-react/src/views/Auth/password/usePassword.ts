import { useEffect, useState } from "react";
import { Form, message } from "antd";
import { useNavigate } from "react-router-dom";
import {
  sendSmsCode,
  smsResetPassword,
  SMS_SCENE_RESET_PASSWORD,
  getTenantByWebsite,
} from "@/api/login";
import { isCaptchaRequiredError, useCaptcha } from "@/hooks/useCaptcha";
import { env } from "@/config/env";

export function usePassword() {
  const [messageApi, messageHolder] = message.useMessage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [forceCaptcha, setForceCaptcha] = useState(false);
  const [form] = Form.useForm();
  const captcha = useCaptcha(forceCaptcha);

  useEffect(() => {
    if (!countdown) return;
    const timer = window.setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (!env.tenantEnable) return;
    getTenantByWebsite(window.location.host)
      .then((res) => {
        if (res?.name) form.setFieldsValue({ tenantName: res.name });
      })
      .catch(() => {});
  }, [form]);

  const tenantPayload = () =>
    env.tenantEnable ? { tenantName: form.getFieldValue("tenantName") } : {};

  const captchaPayload = () =>
    captcha.enabled
      ? { captchaUuid: captcha.uuid, captchaCode: form.getFieldValue("captchaCode") }
      : {};

  const handleSendSms = async () => {
    const mobile = form.getFieldValue("mobile");
    if (!/^1[3-9]\d{9}$/.test(mobile || "")) {
      messageApi.error("请输入有效的手机号");
      return;
    }
    if (captcha.enabled && !form.getFieldValue("captchaCode")) {
      messageApi.error("请输入图形验证码");
      return;
    }
    try {
      setSmsLoading(true);
      await sendSmsCode({
        mobile,
        scene: SMS_SCENE_RESET_PASSWORD,
        ...tenantPayload(),
        ...captchaPayload(),
      });
      messageApi.success("验证码已发送");
      setCountdown(60);
      form.setFieldValue("captchaCode", "");
      void captcha.refresh();
    } catch (error: any) {
      if (isCaptchaRequiredError(error)) setForceCaptcha(true);
      void captcha.refresh();
    } finally {
      setSmsLoading(false);
    }
  };

  const handlePasswordReset = async (values: any) => {
    try {
      setLoading(true);
      await smsResetPassword({
        mobile: values.mobile,
        code: values.code,
        password: values.password,
        ...tenantPayload(),
        ...captchaPayload(),
      });
      messageApi.success("密码重置成功");
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
    smsLoading,
    countdown,
    captcha,
    tenantEnable: env.tenantEnable,
    messageHolder,
    handlePasswordReset,
    handleSendSms,
    initialValues: {
      tenantName: env.defaultLogin.tenantName || "默认租户",
    },
  };
}
