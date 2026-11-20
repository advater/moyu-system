import { Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import type { SmsChannelVO } from "@/api/system/sms/smsChannel";

export default function SmsTemplateSearch({
  form,
  channels,
  onQuery,
  onReset,
}: {
  form: FormInstance;
  channels: SmsChannelVO[];
  onQuery: () => void;
  onReset: () => void;
}) {
  return (
    <SearchCard form={form}>
      <Form.Item name="type" label="模板类型">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE)} />
      </Form.Item>
      <Form.Item name="status" label="开启状态">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} />
      </Form.Item>
      <Form.Item name="code" label="模板编码">
        <Input placeholder="请输入模板编码" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="name" label="模板名称">
        <Input placeholder="请输入模板名称" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="channelId" label="短信渠道">
        <Select allowClear placeholder="请选择" style={{ width: 180 }} options={channels.map((c) => ({ label: `${c.signature}(${c.code})`, value: c.id }))} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
