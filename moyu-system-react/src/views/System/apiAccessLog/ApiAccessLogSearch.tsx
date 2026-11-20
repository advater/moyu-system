import { DatePicker, Form, Input } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";

const { RangePicker } = DatePicker;

export default function ApiAccessLogSearch({
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
      <Form.Item name="applicationName" label="应用名">
        <Input placeholder="请输入应用名" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="requestUrl" label="请求地址">
        <Input placeholder="请输入请求地址" allowClear style={{ width: 200 }} />
      </Form.Item>
      <Form.Item name="beginTime" label="请求时间">
        <RangePicker showTime style={{ width: 240 }} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
