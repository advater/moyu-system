import { Form, Input, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import SearchCard from "@/components/Page/SearchCard";
import SearchActions from "@/components/Page/SearchActions";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import type { MailAccountVO } from "@/api/system/mail/account";

export default function MailTemplateSearch({
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
      <Form.Item name="name" label="模板名称">
        <Input placeholder="请输入模板名称" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="code" label="模板编码">
        <Input placeholder="请输入模板编码" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="accountId" label="发送账号">
        <Select allowClear placeholder="请选择" style={{ width: 200 }} options={accounts.map((a) => ({ label: a.mail, value: a.id }))} />
      </Form.Item>
      <Form.Item name="status" label="开启状态">
        <Select allowClear placeholder="请选择" style={{ width: 140 }} options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} />
      </Form.Item>
      <SearchActions onQuery={onQuery} onReset={onReset} />
    </SearchCard>
  );
}
