import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import StatusSwitch from "@/components/StatusSwitch";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { SocialClientVO } from "@/api/system/social/client";

export function SocialClientToolbar({
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
      <PermissionGuard permission="system:social-client:create">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增</Button>
      </PermissionGuard>
      <PermissionGuard permission="system:social-client:delete">
        <Button danger icon={<DeleteOutlined />} disabled={!selectedCount} onClick={onDeleteBatch}>批量删除</Button>
      </PermissionGuard>
    </Space>
  );
}

export default function SocialClientTable({
  loading,
  list,
  selectedIds,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  loading: boolean;
  list: SocialClientVO[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStatusChange: (row: SocialClientVO, status: number) => void;
}) {
  const columns: ColumnsType<SocialClientVO> = [
    { title: "编号", dataIndex: "id", width: 80, align: "center" },
    { title: "应用名", dataIndex: "name", align: "center" },
    { title: "社交平台", dataIndex: "socialType", align: "center", render: (v) => <DictTag type={DICT_TYPE.SYSTEM_SOCIAL_TYPE} value={v} /> },
    { title: "用户类型", dataIndex: "userType", align: "center", render: (v) => <DictTag type={DICT_TYPE.USER_TYPE} value={v} /> },
    { title: "客户端编号", dataIndex: "clientId", ellipsis: true },
    { title: "状态", dataIndex: "status", width: 90, align: "center", render: (_, row) => (
      <StatusSwitch value={row.status} permission="system:social-client:update" onChange={(status) => onStatusChange(row, status)} />
    ) },
    { title: "创建时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 140,
      align: "center",
      render: (_, row) => (
        <Space>
          <PermissionGuard permission="system:social-client:update">
            <Button type="link" size="small" onClick={() => onEdit(row.id!)}>修改</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:social-client:delete">
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
