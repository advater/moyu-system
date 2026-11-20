import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { NotifyMessageVO } from "@/api/system/notify/message";

export function MyNotifyToolbar({
  selectedCount,
  onMarkRead,
  onMarkAllRead,
}: {
  selectedCount: number;
  onMarkRead: () => void;
  onMarkAllRead: () => void;
}) {
  return (
    <Space>
      <Button disabled={!selectedCount} onClick={onMarkRead}>标记已读</Button>
      <Button onClick={onMarkAllRead}>全部已读</Button>
    </Space>
  );
}

export default function MyNotifyTable({
  loading,
  list,
  selectedIds,
  onSelect,
  onDetail,
}: {
  loading: boolean;
  list: NotifyMessageVO[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onDetail: (row: NotifyMessageVO) => void;
}) {
  const columns: ColumnsType<NotifyMessageVO> = [
    { title: "发送人", dataIndex: "templateNickname", width: 140, align: "center" },
    { title: "发送时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    { title: "类型", dataIndex: "templateType", width: 100, align: "center", render: (v) => <DictTag type={DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE} value={v} /> },
    { title: "消息内容", dataIndex: "templateContent", ellipsis: true },
    { title: "是否已读", dataIndex: "readStatus", width: 90, align: "center", render: (v) => (v ? "已读" : "未读") },
    {
      title: "操作",
      key: "action",
      width: 80,
      align: "center",
      render: (_, row) => <Button type="link" size="small" onClick={() => onDetail(row)}>详情</Button>,
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={list}
      pagination={false}
      rowSelection={{
        selectedRowKeys: selectedIds,
        onChange: (keys) => onSelect(keys as number[]),
        getCheckboxProps: (row) => ({ disabled: !!row.readStatus }),
      }}
    />
  );
}
