import { Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";

export default function ApiErrorLogSearch({
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
      <Form.Item name="requestUrl" label="请求地址">
        <Input placeholder="请输入请求地址" allowClear style={{ width: 200 }} />
      </Form.Item>
      <Form.Item name="exceptionName" label="异常名">
        <Input placeholder="请输入异常名" allowClear style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="processStatus" label="处理状态">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.INFRA_API_ERROR_LOG_PROCESS_STATUS)} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
