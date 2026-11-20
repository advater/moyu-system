import { Form, Input } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";

export default function FileSearch({
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
      <Form.Item name="name" label="文件名">
        <Input placeholder="请输入文件名" allowClear style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="type" label="文件类型">
        <Input placeholder="如 image/" allowClear style={{ width: 140 }} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
