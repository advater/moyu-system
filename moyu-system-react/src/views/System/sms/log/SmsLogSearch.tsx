import { DatePicker, Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import type { SmsChannelVO } from "@/api/system/sms/smsChannel";

const { RangePicker } = DatePicker;

export default function SmsLogSearch({
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
      <Form.Item name="mobile" label="手机号">
        <Input placeholder="请输入手机号" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="channelId" label="短信渠道">
        <Select allowClear placeholder="请选择" style={{ width: 180 }} options={channels.map((c) => ({ label: `${c.signature}(${c.code})`, value: c.id }))} />
      </Form.Item>
      <Form.Item name="sendStatus" label="发送状态">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.SYSTEM_SMS_SEND_STATUS)} />
      </Form.Item>
      <Form.Item name="receiveStatus" label="接收状态">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS)} />
      </Form.Item>
      <Form.Item name="createTime" label="创建时间">
        <RangePicker showTime style={{ width: 240 }} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
