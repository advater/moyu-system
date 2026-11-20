import { Form, Select } from "antd";
import SendTemplateModal from "@/components/SendTemplateModal";
import type { MailTemplateVO } from "@/api/system/mail/template";

export default function MailTemplateSendModal({
  template,
  loading,
  onClose,
  onSubmit,
}: {
  template: MailTemplateVO | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, any>) => Promise<void>;
}) {
  return (
    <SendTemplateModal
      open={!!template}
      title="测试发送邮件"
      content={template?.content}
      loading={loading}
      extraFields={
        <Form.Item name="toMails" label="收件邮箱" rules={[{ required: true, message: "收件邮箱不能为空" }]}>
          <Select mode="tags" placeholder="输入邮箱后回车" />
        </Form.Item>
      }
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
