import { Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";

export default function NoticeSearch({
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
      <Form.Item name="title" label="公告标题">
        <Input placeholder="请输入公告标题" allowClear style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="status" label="公告状态">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
