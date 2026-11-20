import { Form, Input } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";

export default function ErrorCodeSearch({
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
      <Form.Item name="applicationName" label="应用名">
        <Input placeholder="请输入应用名" allowClear style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="code" label="错误码">
        <Input placeholder="请输入错误码" allowClear style={{ width: 140 }} />
      </Form.Item>
      <Form.Item name="message" label="错误提示">
        <Input placeholder="请输入错误提示" allowClear style={{ width: 180 }} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
