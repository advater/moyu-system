import { Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";

export default function OAuth2TokenSearch({
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
      <Form.Item name="userId" label="用户编号">
        <Input placeholder="请输入用户编号" allowClear style={{ width: 140 }} />
      </Form.Item>
      <Form.Item name="userType" label="用户类型">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.USER_TYPE)} />
      </Form.Item>
      <Form.Item name="clientId" label="客户端编号">
        <Input placeholder="请输入客户端编号" allowClear style={{ width: 160 }} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
