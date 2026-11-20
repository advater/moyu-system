import { Form, Input } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";

export default function ConfigSearch({
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
      <Form.Item name="name" label="参数名称">
        <Input placeholder="请输入参数名称" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="configKey" label="参数键名">
        <Input placeholder="请输入参数键名" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="category" label="参数分类">
        <Input placeholder="请输入参数分类" allowClear style={{ width: 140 }} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
