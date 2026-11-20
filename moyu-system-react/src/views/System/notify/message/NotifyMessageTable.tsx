import { Button, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import PermissionGuard from "@/components/PermissionGuard";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { NotifyMessageVO } from "@/api/system/notify/message";

export default function NotifyMessageTable({
  loading,
  list,
  onDetail,
}: {
  loading: boolean;
  list: NotifyMessageVO[];
  onDetail: (row: NotifyMessageVO) => void;
}) {
  const columns: ColumnsType<NotifyMessageVO> = [
    { title: "编号", dataIndex: "id", width: 80, align: "center" },
    { title: "用户编号", dataIndex: "userId", width: 100, align: "center" },
    { title: "用户类型", dataIndex: "userType", width: 100, align: "center", render: (v) => <DictTag type={DICT_TYPE.USER_TYPE} value={v} /> },
    { title: "模板编码", dataIndex: "templateCode", align: "center" },
    { title: "类型", dataIndex: "templateType", align: "center", render: (v) => <DictTag type={DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE} value={v} /> },
    { title: "发送人", dataIndex: "templateNickname", align: "center" },
    { title: "是否已读", dataIndex: "readStatus", width: 90, align: "center", render: (v) => (v ? "已读" : "未读") },
    { title: "发送时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 80,
      align: "center",
      render: (_, row) => (
        <PermissionGuard permission="system:notify-message:query">
          <Button type="link" size="small" onClick={() => onDetail(row)}>详情</Button>
        </PermissionGuard>
      ),
    },
  ];

  return (
    <Table rowKey="id" loading={loading} columns={columns} dataSource={list} pagination={false} scroll={{ x: 1100 }} />
  );
}
