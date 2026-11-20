import { DatePicker, Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import type { UserVO } from "@/api/system/user";

const { RangePicker } = DatePicker;

export default function OperateLogSearch({
  form,
  userList,
  onQuery,
  onReset,
}: {
  form: FormInstance;
  userList: UserVO[];
  onQuery: () => void;
  onReset: () => void;
}) {
  return (
    <SearchCard form={form}>
      <Form.Item name="userId" label="操作人">
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="请选择操作人员"
          style={{ width: 180 }}
          options={userList.map((u) => ({ label: u.nickname, value: u.id }))}
        />
      </Form.Item>
      <Form.Item name="type" label="操作模块">
        <Input placeholder="请输入操作模块" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="subType" label="操作名">
        <Input placeholder="请输入操作名" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="action" label="操作内容">
        <Input placeholder="请输入操作内容" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="bizId" label="业务编号">
        <Input placeholder="请输入业务编号" allowClear style={{ width: 140 }} />
      </Form.Item>
      <Form.Item name="createTime" label="操作时间">
        <RangePicker showTime style={{ width: 240 }} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
