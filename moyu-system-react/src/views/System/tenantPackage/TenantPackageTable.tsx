import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import StatusSwitch from "@/components/StatusSwitch";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { TenantPackageVO } from "@/api/system/tenantPackage";

export function TenantPackageToolbar({
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
      <PermissionGuard permission="system:tenant-package:create">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增</Button>
      </PermissionGuard>
      <PermissionGuard permission="system:tenant-package:delete">
        <Button danger icon={<DeleteOutlined />} disabled={!selectedCount} onClick={onDeleteBatch}>批量删除</Button>
      </PermissionGuard>
    </Space>
  );
}

export default function TenantPackageTable({
  loading,
  list,
  selectedIds,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  loading: boolean;
  list: TenantPackageVO[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStatusChange: (row: TenantPackageVO, status: number) => void;
}) {
  const columns: ColumnsType<TenantPackageVO> = [
    { title: "套餐编号", dataIndex: "id", width: 120, align: "center" },
    { title: "套餐名", dataIndex: "name", align: "center" },
    { title: "状态", dataIndex: "status", width: 100, align: "center", render: (_, row) => (
      <StatusSwitch value={row.status} permission="system:tenant-package:update" onChange={(status) => onStatusChange(row, status)} />
    ) },
    { title: "备注", dataIndex: "remark", align: "center" },
    { title: "创建时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 140,
      align: "center",
      render: (_, row) => (
        <Space>
          <PermissionGuard permission="system:tenant-package:update">
            <Button type="link" size="small" onClick={() => onEdit(row.id!)}>编辑</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:tenant-package:delete">
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
