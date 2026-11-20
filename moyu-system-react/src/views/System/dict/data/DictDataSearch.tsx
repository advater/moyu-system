import { Button, Form, Input, Select, Space } from "antd";
import type { FormInstance } from "antd/es/form";
import { ArrowLeftOutlined } from "@ant-design/icons";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import type { DictTypeVO } from "@/api/system/dict/dict.type";

export default function DictDataSearch({
  form,
  currentType,
  typeList,
  onTypeChange,
  onBack,
  onQuery,
  onReset,
}: {
  form: FormInstance;
  currentType: string;
  typeList: DictTypeVO[];
  onTypeChange: (value: string) => void;
  onBack: () => void;
  onQuery: () => void;
  onReset: () => void;
}) {
  return (
    <SearchCard form={form}>
      <Form.Item label="字典名称">
        <Select
          style={{ width: 200 }}
          value={currentType}
          onChange={onTypeChange}
          options={typeList.map((t) => ({ label: t.name, value: t.type }))}
        />
      </Form.Item>
      <Form.Item name="label" label="字典标签">
        <Input placeholder="请输入字典标签" allowClear style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="status" label="状态">
        <Select allowClear placeholder="数据状态" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>返回</Button>
        </Space>
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
