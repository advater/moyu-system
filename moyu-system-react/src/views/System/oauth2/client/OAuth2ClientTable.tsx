import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import StatusSwitch from "@/components/StatusSwitch";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { OAuth2ClientVO } from "@/api/system/oauth2/client";

export function OAuth2ClientToolbar({
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
      <PermissionGuard permission="system:oauth2-client:create">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增</Button>
      </PermissionGuard>
      <PermissionGuard permission="system:oauth2-client:delete">
        <Button danger icon={<DeleteOutlined />} disabled={!selectedCount} onClick={onDeleteBatch}>批量删除</Button>
      </PermissionGuard>
    </Space>
  );
}

export default function OAuth2ClientTable({
  loading,
  list,
  selectedIds,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  loading: boolean;
  list: OAuth2ClientVO[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStatusChange: (row: OAuth2ClientVO, status: number) => void;
}) {
  const columns: ColumnsType<OAuth2ClientVO> = [
    { title: "编号", dataIndex: "id", width: 80, align: "center" },
    { title: "客户端编号", dataIndex: "clientId", align: "center" },
    { title: "应用名", dataIndex: "name", align: "center" },
    { title: "状态", dataIndex: "status", width: 90, align: "center", render: (_, row) => (
      <StatusSwitch value={row.status} permission="system:oauth2-client:update" onChange={(status) => onStatusChange(row, status)} />
    ) },
    { title: "访问令牌有效期", dataIndex: "accessTokenValiditySeconds", align: "center", render: (v) => `${v} 秒` },
    { title: "刷新令牌有效期", dataIndex: "refreshTokenValiditySeconds", align: "center", render: (v) => `${v} 秒` },
    { title: "创建时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 140,
      align: "center",
      render: (_, row) => (
        <Space>
          <PermissionGuard permission="system:oauth2-client:update">
            <Button type="link" size="small" onClick={() => onEdit(row.id!)}>修改</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:oauth2-client:delete">
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
