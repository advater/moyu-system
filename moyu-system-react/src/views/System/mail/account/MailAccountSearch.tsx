import { Form, Input } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";

export default function MailAccountSearch({
  form,
  onQuery,
  onReset,
}: {
  form: FormInstance;
  onQuery: () => void;
  onReset: () => void;
}) {
  return (
    <SearchCard form={form}>
      <Form.Item name="mail" label="邮箱">
        <Input placeholder="请输入邮箱" allowClear style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="username" label="用户名">
        <Input placeholder="请输入用户名" allowClear style={{ width: 160 }} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
