import { Button, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, DownloadOutlined, PlusOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import StatusSwitch from "@/components/StatusSwitch";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { TenantVO } from "@/api/system/tenant";
import type { TenantPackageVO } from "@/api/system/tenantPackage";

export function TenantToolbar({
  selectedCount,
  onCreate,
  onExport,
  onDeleteBatch,
}: {
  selectedCount: number;
  onCreate: () => void;
  onExport: () => void;
  onDeleteBatch: () => void;
}) {
  return (
    <Space>
      <PermissionGuard permission="system:tenant:create">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增</Button>
      </PermissionGuard>
      <PermissionGuard permission="system:tenant:export">
        <Button icon={<DownloadOutlined />} onClick={onExport}>导出</Button>
      </PermissionGuard>
      <PermissionGuard permission="system:tenant:delete">
        <Button danger icon={<DeleteOutlined />} disabled={!selectedCount} onClick={onDeleteBatch}>批量删除</Button>
      </PermissionGuard>
    </Space>
  );
}

function packageName(id: number | undefined, packageList: TenantPackageVO[]) {
  if (id === 0) return <Tag color="error">系统租户</Tag>;
  const hit = packageList.find((p) => p.id === id);
  return hit ? <Tag color="success">{hit.name}</Tag> : id;
}

export default function TenantTable({
  loading,
  list,
  selectedIds,
  packageList,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  loading: boolean;
  list: TenantVO[];
  selectedIds: number[];
  packageList: TenantPackageVO[];
  onSelect: (ids: number[]) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStatusChange: (row: TenantVO, status: number) => void;
}) {
  const columns: ColumnsType<TenantVO> = [
    { title: "租户编号", dataIndex: "id", width: 90, align: "center" },
    { title: "租户名", dataIndex: "name", align: "center" },
    { title: "租户套餐", dataIndex: "packageId", align: "center", render: (v) => packageName(v, packageList) },
    { title: "联系人", dataIndex: "contactName", align: "center" },
    { title: "联系手机", dataIndex: "contactMobile", align: "center" },
    { title: "账号额度", dataIndex: "accountCount", align: "center", render: (v) => <Tag>{v}</Tag> },
    { title: "过期时间", dataIndex: "expireTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "绑定域名",
      dataIndex: "websites",
      render: (websites: string[]) =>
        websites?.length ? websites.map((w) => <Tag key={w}>{w}</Tag>) : "-",
    },
    { title: "租户状态", dataIndex: "status", align: "center", render: (_, row) => (
      <StatusSwitch value={row.status} permission="system:tenant:update" onChange={(status) => onStatusChange(row, status)} />
    ) },
    { title: "创建时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 140,
      fixed: "right",
      align: "center",
      render: (_, row) => (
        <Space>
          <PermissionGuard permission="system:tenant:update">
            <Button type="link" size="small" onClick={() => onEdit(row.id!)}>编辑</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:tenant:delete">
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
      scroll={{ x: 1400 }}
    />
  );
}
