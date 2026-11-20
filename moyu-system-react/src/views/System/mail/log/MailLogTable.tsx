import { Button, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import PermissionGuard from "@/components/PermissionGuard";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { MailLogVO } from "@/api/system/mail/log";

export default function MailLogTable({
  loading,
  list,
  onDetail,
}: {
  loading: boolean;
  list: MailLogVO[];
  onDetail: (row: MailLogVO) => void;
}) {
  const columns: ColumnsType<MailLogVO> = [
    { title: "编号", dataIndex: "id", width: 80, align: "center" },
    { title: "接收邮箱", dataIndex: "toMails", ellipsis: true, render: (v) => (Array.isArray(v) ? v.join(", ") : v) },
    { title: "邮件标题", dataIndex: "templateTitle", ellipsis: true },
    { title: "发送状态", dataIndex: "sendStatus", width: 110, align: "center", render: (v) => <DictTag type={DICT_TYPE.SYSTEM_MAIL_SEND_STATUS} value={v} /> },
    { title: "发送时间", dataIndex: "sendTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 80,
      align: "center",
      render: (_, row) => (
        <PermissionGuard permission="system:mail-log:query">
          <Button type="link" size="small" onClick={() => onDetail(row)}>详情</Button>
        </PermissionGuard>
      ),
    },
  ];

  return (
    <Table rowKey="id" loading={loading} columns={columns} dataSource={list} pagination={false} />
  );
}
