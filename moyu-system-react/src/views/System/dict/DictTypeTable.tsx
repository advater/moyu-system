import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, DownloadOutlined, PlusOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import StatusSwitch from "@/components/StatusSwitch";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { DictTypeVO } from "@/api/system/dict/types";

export function DictTypeToolbar({
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
      <PermissionGuard permission="system:dict:create">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增</Button>
      </PermissionGuard>
      <PermissionGuard permission="system:dict:export">
        <Button icon={<DownloadOutlined />} onClick={onExport}>导出</Button>
      </PermissionGuard>
      <PermissionGuard permission="system:dict:delete">
        <Button danger icon={<DeleteOutlined />} disabled={!selectedCount} onClick={onDeleteBatch}>批量删除</Button>
      </PermissionGuard>
    </Space>
  );
}

export default function DictTypeTable({
  loading,
  list,
  selectedIds,
  onSelect,
  onEdit,
  onData,
  onDelete,
  onStatusChange,
}: {
  loading: boolean;
  list: DictTypeVO[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onEdit: (id: number) => void;
  onData: (type: string) => void;
  onDelete: (id: number) => void;
  onStatusChange: (row: DictTypeVO, status: number) => void;
}) {
  const columns: ColumnsType<DictTypeVO> = [
    { title: "字典编号", dataIndex: "id", align: "center" },
    { title: "字典名称", dataIndex: "name", align: "center" },
    { title: "字典类型", dataIndex: "type", align: "center" },
    { title: "状态", dataIndex: "status", align: "center", render: (_, row) => (
      <StatusSwitch value={row.status} permission="system:dict:update" onChange={(status) => onStatusChange(row, status)} />
    ) },
    { title: "备注", dataIndex: "remark", align: "center" },
    { title: "创建时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 200,
      align: "center",
      render: (_, row) => (
        <Space>
          <PermissionGuard permission="system:dict:update">
            <Button type="link" size="small" onClick={() => onEdit(row.id!)}>修改</Button>
          </PermissionGuard>
          <Button type="link" size="small" onClick={() => onData(row.type)}>数据</Button>
          <PermissionGuard permission="system:dict:delete">
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
