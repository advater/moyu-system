import { Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";

export default function SocialUserSearch({
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
      <Form.Item name="type" label="社交平台">
        <Select allowClear placeholder="请选择" style={{ width: 160 }} options={getIntDictOptions(DICT_TYPE.SYSTEM_SOCIAL_TYPE)} />
      </Form.Item>
      <Form.Item name="nickname" label="昵称">
        <Input placeholder="请输入昵称" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="openid" label="openid">
        <Input placeholder="请输入 openid" allowClear style={{ width: 180 }} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
