import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, PlusOutlined, SortAscendingOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import StatusSwitch from "@/components/StatusSwitch";
import type { UserVO } from "@/api/system/user";

export function DeptToolbar({
  selectedCount,
  expanded,
  onCreate,
  onToggleExpand,
  onDeleteBatch,
}: {
  selectedCount: number;
  expanded: boolean;
  onCreate: () => void;
  onToggleExpand: () => void;
  onDeleteBatch: () => void;
}) {
  return (
    <Space>
      <PermissionGuard permission="system:dept:create">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增</Button>
      </PermissionGuard>
      <Button icon={<SortAscendingOutlined />} onClick={onToggleExpand}>{expanded ? "折叠" : "展开"}</Button>
      <PermissionGuard permission="system:dept:delete">
        <Button danger icon={<DeleteOutlined />} disabled={!selectedCount} onClick={onDeleteBatch}>批量删除</Button>
      </PermissionGuard>
    </Space>
  );
}

export default function DeptTable({
  loading,
  list,
  userList,
  selectedIds,
  expanded,
  onSelect,
  onEdit,
  onCreateChild,
  onDelete,
  onStatusChange,
}: {
  loading: boolean;
  list: any[];
  userList: UserVO[];
  selectedIds: number[];
  expanded: boolean;
  onSelect: (ids: number[]) => void;
  onEdit: (id: number) => void;
  onCreateChild: (parentId: number) => void;
  onDelete: (id: number) => void;
  onStatusChange: (row: any, status: number) => void;
}) {
  const columns: ColumnsType<any> = [
    { title: "部门名称", dataIndex: "name" },
    {
      title: "负责人",
      dataIndex: "leaderUserId",
      render: (id) => userList.find((u) => u.id === id)?.nickname || "-",
    },
    { title: "排序", dataIndex: "sort", width: 80 },
    { title: "状态", dataIndex: "status", width: 90, align: "center", render: (_, row) => (
      <StatusSwitch value={row.status} permission="system:dept:update" onChange={(status) => onStatusChange(row, status)} />
    ) },
    {
      title: "操作",
      key: "action",
      width: 220,
      align: "center",
      render: (_, row) => (
        <Space>
          <PermissionGuard permission="system:dept:update">
            <Button type="link" size="small" onClick={() => onEdit(row.id)}>修改</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:dept:create">
            <Button type="link" size="small" onClick={() => onCreateChild(row.id)}>新增</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:dept:delete">
            <Button type="link" size="small" danger onClick={() => onDelete(row.id)}>删除</Button>
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
      expandable={{ defaultExpandAllRows: expanded }}
      key={String(expanded)}
    />
  );
}
