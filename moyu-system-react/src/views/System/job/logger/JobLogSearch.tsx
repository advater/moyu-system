import { Button, Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import { ArrowLeftOutlined } from "@ant-design/icons";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";

export default function JobLogSearch({
  form,
  onQuery,
  onReset,
  onBack,
}: {
  form: FormInstance;
  onQuery: () => void;
  onReset: () => void;
  onBack: () => void;
}) {
  return (
    <SearchCard form={form}>
      <Form.Item name="jobId" label="任务编号">
        <Input placeholder="请输入任务编号" allowClear style={{ width: 140 }} />
      </Form.Item>
      <Form.Item name="handlerName" label="处理器名字">
        <Input placeholder="请输入处理器名字" allowClear style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="status" label="执行状态">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.INFRA_JOB_LOG_STATUS)} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
      <Form.Item>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>返回</Button>
      </Form.Item>
    </SearchCard>
  );
}
