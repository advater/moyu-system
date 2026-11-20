import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DownloadOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { SmsLogVO } from "@/api/system/sms/smsLog";

export function SmsLogToolbar({
  exportLoading,
  onExport,
}: {
  exportLoading: boolean;
  onExport: () => void;
}) {
  return (
    <Space>
      <PermissionGuard permission="system:sms-log:export">
        <Button icon={<DownloadOutlined />} loading={exportLoading} onClick={onExport}>导出</Button>
      </PermissionGuard>
    </Space>
  );
}

export default function SmsLogTable({
  loading,
  list,
  onDetail,
}: {
  loading: boolean;
  list: SmsLogVO[];
  onDetail: (row: SmsLogVO) => void;
}) {
  const columns: ColumnsType<SmsLogVO> = [
    { title: "编号", dataIndex: "id", width: 80, align: "center" },
    { title: "手机号", dataIndex: "mobile", width: 130, align: "center" },
    { title: "短信内容", dataIndex: "templateContent", ellipsis: true },
    { title: "发送状态", dataIndex: "sendStatus", width: 110, align: "center", render: (v) => <DictTag type={DICT_TYPE.SYSTEM_SMS_SEND_STATUS} value={v} /> },
    { title: "接收状态", dataIndex: "receiveStatus", width: 110, align: "center", render: (v) => <DictTag type={DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS} value={v} /> },
    { title: "渠道", dataIndex: "channelCode", width: 110, align: "center", render: (v) => <DictTag type={DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE} value={v} /> },
    { title: "创建时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 80,
      align: "center",
      render: (_, row) => (
        <PermissionGuard permission="system:sms-log:query">
          <Button type="link" size="small" onClick={() => onDetail(row)}>详情</Button>
        </PermissionGuard>
      ),
    },
  ];

  return (
    <Table rowKey="id" loading={loading} columns={columns} dataSource={list} pagination={false} scroll={{ x: 1100 }} />
  );
}
