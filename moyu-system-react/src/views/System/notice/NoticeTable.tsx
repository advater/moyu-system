import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import DictTag from "@/components/DictTag";
import StatusSwitch from "@/components/StatusSwitch";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { NoticeVO } from "@/api/system/notice";

export function NoticeToolbar({
  selectedCount,
  onCreate,
  onDeleteBatch,
}: {
  selectedCount: number;
  onCreate: () => void;
  onDeleteBatch: () => void;
}) {
  return (
    <Space>
      <PermissionGuard permission="system:notice:create">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增</Button>
      </PermissionGuard>
      <PermissionGuard permission="system:notice:delete">
        <Button danger icon={<DeleteOutlined />} disabled={!selectedCount} onClick={onDeleteBatch}>批量删除</Button>
      </PermissionGuard>
    </Space>
  );
}

export default function NoticeTable({
  loading,
  list,
  selectedIds,
  onSelect,
  onEdit,
  onDelete,
  onPush,
  onStatusChange,
}: {
  loading: boolean;
  list: NoticeVO[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onPush: (id: number) => void;
  onStatusChange: (row: NoticeVO, status: number) => void;
}) {
  const columns: ColumnsType<NoticeVO> = [
    { title: "公告编号", dataIndex: "id", align: "center" },
    { title: "公告标题", dataIndex: "title", align: "center" },
    { title: "公告类型", dataIndex: "type", align: "center", render: (v) => <DictTag type={DICT_TYPE.SYSTEM_NOTICE_TYPE} value={v} /> },
    { title: "状态", dataIndex: "status", align: "center", render: (_, row) => (
      <StatusSwitch value={row.status} permission="system:notice:update" onChange={(status) => onStatusChange(row, status)} />
    ) },
    { title: "创建时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 200,
      align: "center",
      render: (_, row) => (
        <Space>
          <PermissionGuard permission="system:notice:update">
            <Button type="link" size="small" onClick={() => onEdit(row.id!)}>修改</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:notice:push">
            <Button type="link" size="small" onClick={() => onPush(row.id!)}>推送</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:notice:delete">
            <Button type="link" size="small" danger onClick={() => onDelete(row.id!)}>删除</Button>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={list}
      pagination={false}
      rowSelection={{ selectedRowKeys: selectedIds, onChange: (keys) => onSelect(keys as number[]) }}
    />
  );
}
