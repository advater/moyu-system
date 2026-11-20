import { useEffect, type ReactNode } from "react";
import { Form, Input, Modal } from "antd";
import { extractTemplateParams } from "@/utils/dict";

export default function SendTemplateModal({
  open,
  title,
  content,
  extraFields,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  title: string;
  content?: string;
  extraFields?: ReactNode;
  onClose: () => void;
  onSubmit: (values: Record<string, any>) => Promise<void>;
  loading?: boolean;
}) {
  const [form] = Form.useForm();
  const params = extractTemplateParams(content);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
  }, [open, content]);

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      confirmLoading={loading}
      onOk={async () => {
        const values = await form.validateFields();
        const templateParams: Record<string, any> = {};
        params.forEach((key) => {
          templateParams[key] = values[`param_${key}`];
        });
        await onSubmit({ ...values, templateParams });
      }}
      destroyOnHidden
    >
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        {extraFields}
        {params.map((key) => (
          <Form.Item key={key} name={`param_${key}`} label={key} rules={[{ required: true, message: `请输入 ${key}` }]}>
            <Input />
          </Form.Item>
        ))}
      </Form>
    </Modal>
  );
}
