import { Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";

export default function MenuSearch({
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
      <Form.Item name="name" label="菜单名称">
        <Input placeholder="请输入菜单名称" allowClear style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="status" label="状态">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
