import { DatePicker, Form, Input } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";

const { RangePicker } = DatePicker;

export default function LoginLogSearch({
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
      <Form.Item name="userIp" label="登录地址">
        <Input placeholder="请输入登录地址" allowClear style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="createTime" label="登录日期">
        <RangePicker showTime style={{ width: 240 }} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
