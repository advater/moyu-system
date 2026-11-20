import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import type { MailAccountVO } from "@/api/system/mail/account";

export function MailAccountToolbar({
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
      <PermissionGuard permission="system:mail-account:create">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增</Button>
      </PermissionGuard>
      <PermissionGuard permission="system:mail-account:delete">
        <Button danger icon={<DeleteOutlined />} disabled={!selectedCount} onClick={onDeleteBatch}>批量删除</Button>
      </PermissionGuard>
    </Space>
  );
}

export default function MailAccountTable({
  loading,
  list,
  selectedIds,
  onSelect,
  onEdit,
  onDelete,
}: {
  loading: boolean;
  list: MailAccountVO[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const columns: ColumnsType<MailAccountVO> = [
    { title: "编号", dataIndex: "id", width: 80, align: "center" },
    { title: "邮箱", dataIndex: "mail", align: "center" },
    { title: "用户名", dataIndex: "username", align: "center" },
    { title: "SMTP 服务器", dataIndex: "host", align: "center" },
    { title: "SMTP 端口", dataIndex: "port", align: "center" },
    { title: "SSL", dataIndex: "sslEnable", align: "center", render: (v) => (v ? "是" : "否") },
    {
      title: "操作",
      key: "action",
      width: 140,
      align: "center",
      render: (_, row) => (
        <Space>
          <PermissionGuard permission="system:mail-account:update">
            <Button type="link" size="small" onClick={() => onEdit(row.id!)}>修改</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:mail-account:delete">
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
