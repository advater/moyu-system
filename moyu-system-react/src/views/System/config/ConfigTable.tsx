import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { ConfigVO } from "@/api/system/config";

export function ConfigToolbar({
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
      <PermissionGuard permission="system:config:create">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增</Button>
      </PermissionGuard>
      <PermissionGuard permission="system:config:delete">
        <Button danger icon={<DeleteOutlined />} disabled={!selectedCount} onClick={onDeleteBatch}>批量删除</Button>
      </PermissionGuard>
    </Space>
  );
}

export default function ConfigTable({
  loading,
  list,
  selectedIds,
  onSelect,
  onEdit,
  onDelete,
}: {
  loading: boolean;
  list: ConfigVO[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const columns: ColumnsType<ConfigVO> = [
    { title: "参数主键", dataIndex: "id", width: 90, align: "center" },
    { title: "参数分类", dataIndex: "category", align: "center" },
    { title: "参数名称", dataIndex: "name", align: "center" },
    { title: "参数键名", dataIndex: "configKey", align: "center" },
    { title: "参数键值", dataIndex: "value", ellipsis: true },
    { title: "是否可见", dataIndex: "visible", width: 90, align: "center", render: (v) => (v ? "是" : "否") },
    { title: "备注", dataIndex: "remark", ellipsis: true },
    { title: "创建时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 140,
      align: "center",
      render: (_, row) => (
        <Space>
          <PermissionGuard permission="system:config:update">
            <Button type="link" size="small" onClick={() => onEdit(row.id!)}>修改</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:config:delete">
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
