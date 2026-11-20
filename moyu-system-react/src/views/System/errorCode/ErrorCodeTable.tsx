import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { ErrorCodeVO } from "@/api/system/errorCode";

export function ErrorCodeToolbar({
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
      <PermissionGuard permission="system:error-code:create">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增</Button>
      </PermissionGuard>
      <PermissionGuard permission="system:error-code:delete">
        <Button danger icon={<DeleteOutlined />} disabled={!selectedCount} onClick={onDeleteBatch}>批量删除</Button>
      </PermissionGuard>
    </Space>
  );
}

export default function ErrorCodeTable({
  loading,
  list,
  selectedIds,
  onSelect,
  onEdit,
  onDelete,
}: {
  loading: boolean;
  list: ErrorCodeVO[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const columns: ColumnsType<ErrorCodeVO> = [
    { title: "编号", dataIndex: "id", width: 80, align: "center" },
    { title: "类型", dataIndex: "type", width: 90, align: "center", render: (v) => (v === 1 ? "自动" : "手动") },
    { title: "应用名", dataIndex: "applicationName", align: "center" },
    { title: "错误码", dataIndex: "code", width: 140, align: "center" },
    { title: "错误提示", dataIndex: "message", ellipsis: true },
    { title: "备注", dataIndex: "memo", ellipsis: true },
    { title: "创建时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 140,
      align: "center",
      render: (_, row) => (
        <Space>
          <PermissionGuard permission="system:error-code:update">
            <Button type="link" size="small" onClick={() => onEdit(row.id!)}>修改</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:error-code:delete">
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
