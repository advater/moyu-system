import { Form, Select } from "antd";
import SendTemplateModal from "@/components/SendTemplateModal";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import type { NotifyTemplateVO } from "@/api/system/notify/template";
import type { UserVO } from "@/api/system/user";

export default function NotifyTemplateSendModal({
  template,
  users,
  loading,
  onClose,
  onSubmit,
}: {
  template: NotifyTemplateVO | null;
  users: UserVO[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, any>) => Promise<void>;
}) {
  return (
    <SendTemplateModal
      open={!!template}
      title="测试发送站内信"
      content={template?.content}
      loading={loading}
      extraFields={
        <>
          <Form.Item name="userId" label="接收人" rules={[{ required: true, message: "请选择接收人" }]}>
            <Select showSearch optionFilterProp="label" options={users.map((u) => ({ label: u.nickname, value: u.id }))} />
          </Form.Item>
          <Form.Item name="userType" label="用户类型" initialValue={2} rules={[{ required: true }]}>
            <Select options={getIntDictOptions(DICT_TYPE.USER_TYPE)} />
          </Form.Item>
        </>
      }
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
