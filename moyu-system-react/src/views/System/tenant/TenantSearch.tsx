import { DatePicker, Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";

const { RangePicker } = DatePicker;

export default function TenantSearch({
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
      <Form.Item name="name" label="租户名">
        <Input placeholder="请输入租户名" allowClear style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="contactName" label="联系人">
        <Input placeholder="请输入联系人" allowClear style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="contactMobile" label="联系手机">
        <Input placeholder="请输入联系手机" allowClear style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="status" label="租户状态">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} />
      </Form.Item>
      <Form.Item name="createTime" label="创建时间">
        <RangePicker showTime style={{ width: 240 }} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
