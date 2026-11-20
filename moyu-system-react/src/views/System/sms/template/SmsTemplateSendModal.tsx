import { Form, Input } from "antd";
import SendTemplateModal from "@/components/SendTemplateModal";
import type { SmsTemplateVO } from "@/api/system/sms/smsTemplate";

export default function SmsTemplateSendModal({
  template,
  loading,
  onClose,
  onSubmit,
}: {
  template: SmsTemplateVO | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, any>) => Promise<void>;
}) {
  return (
    <SendTemplateModal
      open={!!template}
      title="测试发送短信"
      content={template?.content}
      loading={loading}
      extraFields={
        <Form.Item name="mobile" label="手机号" rules={[{ required: true, message: "手机号不能为空" }]}>
          <Input />
        </Form.Item>
      }
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
