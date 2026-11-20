import { Form, Input } from "antd";
import { SafetyOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

export default function CaptchaField({
  enabled,
  image,
  onRefresh,
}: {
  enabled: boolean;
  image: string;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();
  if (!enabled) return null;

  return (
    <Form.Item
      name="captchaCode"
      rules={[{ required: true, message: t("login.codePlaceholder") }]}
    >
      <Input
        prefix={<SafetyOutlined />}
        placeholder={t("login.codePlaceholder")}
        maxLength={8}
        addonAfter={
          <span
            role="button"
            tabIndex={0}
            onClick={onRefresh}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onRefresh();
            }}
            title={t("captcha.refresh")}
            style={{ display: "inline-block", width: 104, height: 22, cursor: "pointer" }}
          >
            {image ? (
              <img src={image} alt="captcha" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            ) : (
              t("captcha.refresh")
            )}
          </span>
        }
      />
    </Form.Item>
  );
}
