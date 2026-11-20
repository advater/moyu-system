import { DatePicker, Form, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import { DICT_TYPE, getBoolDictOptions } from "@/utils/dict";

const { RangePicker } = DatePicker;

export default function MyNotifySearch({
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
      <Form.Item name="readStatus" label="是否已读">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)} />
      </Form.Item>
      <Form.Item name="createTime" label="发送时间">
        <RangePicker showTime style={{ width: 240 }} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
