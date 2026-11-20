import "./index.scss";
import { usePassword } from "./usePassword";
import PasswordForm from "./PasswordForm";

export default function PasswordPage() {
  const p = usePassword();

  return (
    <>
      {p.messageHolder}
      <section className="password-page">
        <h1 className="password-title">找回密码</h1>
        <div className="password-box">
          <PasswordForm
            form={p.form}
            loading={p.loading}
            smsLoading={p.smsLoading}
            countdown={p.countdown}
            tenantEnable={p.tenantEnable}
            captcha={p.captcha}
            initialValues={p.initialValues}
            onFinish={p.handlePasswordReset}
            onSendSms={p.handleSendSms}
          />
        </div>
      </section>
    </>
  );
}
