import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, SortAscendingOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import StatusSwitch from "@/components/StatusSwitch";

export function MenuToolbar({
  expanded,
  onCreate,
  onToggleExpand,
}: {
  expanded: boolean;
  onCreate: () => void;
  onToggleExpand: () => void;
}) {
  return (
    <Space>
      <PermissionGuard permission="system:menu:create">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增</Button>
      </PermissionGuard>
      <Button icon={<SortAscendingOutlined />} onClick={onToggleExpand}>{expanded ? "折叠" : "展开"}</Button>
    </Space>
  );
}

export default function MenuTable({
  loading,
  list,
  expanded,
  onEdit,
  onCreateChild,
  onDelete,
  onStatusChange,
}: {
  loading: boolean;
  list: any[];
  expanded: boolean;
  onEdit: (id: number, parentId: number) => void;
  onCreateChild: (parentId: number) => void;
  onDelete: (id: number) => void;
  onStatusChange: (row: any, status: number) => void;
}) {
  const columns: ColumnsType<any> = [
    { title: "菜单名称", dataIndex: "name", width: 220 },
    { title: "图标", dataIndex: "icon", width: 80, align: "center" },
    { title: "排序", dataIndex: "sort", width: 80, align: "center" },
    { title: "权限标识", dataIndex: "permission", ellipsis: true },
    { title: "组件路径", dataIndex: "component", ellipsis: true },
    { title: "组件名称", dataIndex: "componentName", ellipsis: true },
    { title: "状态", dataIndex: "status", width: 90, align: "center", render: (_, row) => (
      row.statusLocked ? null : (
        <StatusSwitch
          value={row.status}
          permission="system:menu:update"
          onChange={(status) => onStatusChange(row, status)}
        />
      )
    ) },
    {
      title: "操作",
      key: "action",
      width: 200,
      align: "center",
      render: (_, row) => (
        <Space>
          <PermissionGuard permission="system:menu:update">
            <Button type="link" size="small" onClick={() => onEdit(row.id, row.parentId)}>修改</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:menu:create">
            <Button type="link" size="small" onClick={() => onCreateChild(row.id)}>新增</Button>
          </PermissionGuard>
          {!row.statusLocked && (
            <PermissionGuard permission="system:menu:delete">
              <Button type="link" size="small" danger onClick={() => onDelete(row.id)}>删除</Button>
            </PermissionGuard>
          )}
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
      expandable={{ defaultExpandAllRows: expanded }}
      key={String(expanded)}
    />
  );
}
