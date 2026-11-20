import { Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";

export default function JobSearch({
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
      <Form.Item name="name" label="任务名称">
        <Input placeholder="请输入任务名称" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="status" label="任务状态">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.INFRA_JOB_STATUS)} />
      </Form.Item>
      <Form.Item name="handlerName" label="处理器名字">
        <Input placeholder="请输入处理器名字" allowClear style={{ width: 180 }} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
