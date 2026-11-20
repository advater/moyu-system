import "./index.scss";
import { useRegister } from "./useRegister";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  const p = useRegister();

  return (
    <>
      {p.messageHolder}
      <section className="register-page">
        <h1 className="register-title">用户注册</h1>
        <div className="register-box">
          <RegisterForm
            form={p.form}
            loading={p.loading}
            tenantEnable={p.tenantEnable}
            captcha={p.captcha}
            initialValues={p.initialValues}
            onFinish={p.handleRegister}
          />
        </div>
      </section>
    </>
  );
}
