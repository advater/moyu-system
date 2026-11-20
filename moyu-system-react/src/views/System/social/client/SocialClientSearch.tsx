import { Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";

export default function SocialClientSearch({
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
      <Form.Item name="name" label="应用名">
        <Input placeholder="请输入应用名" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="socialType" label="社交平台">
        <Select allowClear placeholder="请选择" style={{ width: 160 }} options={getIntDictOptions(DICT_TYPE.SYSTEM_SOCIAL_TYPE)} />
      </Form.Item>
      <Form.Item name="userType" label="用户类型">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.USER_TYPE)} />
      </Form.Item>
      <Form.Item name="status" label="状态">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
