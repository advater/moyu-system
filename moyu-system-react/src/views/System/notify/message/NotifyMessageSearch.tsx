import { DatePicker, Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import type { UserVO } from "@/api/system/user";

const { RangePicker } = DatePicker;

export default function NotifyMessageSearch({
  form,
  users,
  onQuery,
  onReset,
}: {
  form: FormInstance;
  users: UserVO[];
  onQuery: () => void;
  onReset: () => void;
}) {
  return (
    <SearchCard form={form}>
      <Form.Item name="userId" label="用户">
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="请选择用户"
          style={{ width: 180 }}
          options={users.map((u) => ({ label: u.nickname, value: u.id }))}
        />
      </Form.Item>
      <Form.Item name="userType" label="用户类型">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.USER_TYPE)} />
      </Form.Item>
      <Form.Item name="templateCode" label="模板编码">
        <Input placeholder="请输入模板编码" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="templateType" label="类型">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE)} />
      </Form.Item>
      <Form.Item name="createTime" label="发送时间">
        <RangePicker showTime style={{ width: 240 }} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
