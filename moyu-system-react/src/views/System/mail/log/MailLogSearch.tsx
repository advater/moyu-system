import { DatePicker, Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import type { MailAccountVO } from "@/api/system/mail/account";

const { RangePicker } = DatePicker;

export default function MailLogSearch({
  form,
  accounts,
  onQuery,
  onReset,
}: {
  form: FormInstance;
  accounts: MailAccountVO[];
  onQuery: () => void;
  onReset: () => void;
}) {
  return (
    <SearchCard form={form}>
      <Form.Item name="toMail" label="接收邮箱">
        <Input placeholder="请输入接收邮箱" allowClear style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="accountId" label="邮箱账号">
        <Select allowClear placeholder="请选择" style={{ width: 200 }} options={accounts.map((a) => ({ label: a.mail, value: a.id }))} />
      </Form.Item>
      <Form.Item name="sendStatus" label="发送状态">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.SYSTEM_MAIL_SEND_STATUS)} />
      </Form.Item>
      <Form.Item name="createTime" label="发送时间">
        <RangePicker showTime style={{ width: 240 }} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
