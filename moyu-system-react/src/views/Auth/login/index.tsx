import "./index.scss";
import logoUrl from "@/assets/images/logo.svg";
import { useTranslation } from "react-i18next";
import { env } from "@/config/env";
import { useLogin } from "./useLogin";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  const { t } = useTranslation();
  const { form, loading, messageHolder, handleLogin, tenantEnable, captcha, initialValues } = useLogin();

  return (
    <>
      {messageHolder}
      <section className="login-page">
        <div className="login-logo">
          <img src={logoUrl} className="logo" alt="logo" />
          <span className="login-logo-text">{env.title}</span>
        </div>
        <div className="login-box">
          <h1 className="title">{t("login.welcome")}</h1>
          <p className="subtitle">{t("login.message")}</p>
          <LoginForm
            form={form}
            loading={loading}
            tenantEnable={tenantEnable}
            captcha={captcha}
            initialValues={initialValues}
            onFinish={handleLogin}
          />
        </div>
      </section>
    </>
  );
}
