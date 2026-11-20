import { DatePicker, Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";

const { RangePicker } = DatePicker;

export default function UserSearch({
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
      <Form.Item name="username" label="用户名称">
        <Input placeholder="请输入用户名称" allowClear style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="mobile" label="手机号码">
        <Input placeholder="请输入手机号码" allowClear style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="status" label="状态">
        <Select placeholder="请选择状态" allowClear style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} />
      </Form.Item>
      <Form.Item name="createTime" label="创建时间">
        <RangePicker showTime style={{ width: 240 }} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
