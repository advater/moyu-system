import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, DownloadOutlined, PlusOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import StatusSwitch from "@/components/StatusSwitch";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { DictDataVO } from "@/api/system/dict/dict.data";

export function DictDataToolbar({
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

export default function DictDataTable({
  loading,
  list,
  selectedIds,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  loading: boolean;
  list: DictDataVO[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStatusChange: (row: DictDataVO, status: number) => void;
}) {
  const columns: ColumnsType<DictDataVO> = [
    { title: "字典编码", dataIndex: "id", align: "center" },
    { title: "字典标签", dataIndex: "label", align: "center" },
    { title: "字典键值", dataIndex: "value", align: "center" },
    { title: "字典排序", dataIndex: "sort", align: "center" },
    { title: "状态", dataIndex: "status", align: "center", render: (_, row) => (
      <StatusSwitch value={row.status} permission="system:dict:update" onChange={(status) => onStatusChange(row, status)} />
    ) },
    { title: "颜色类型", dataIndex: "colorType", align: "center" },
    { title: "CSS Class", dataIndex: "cssClass", align: "center" },
    { title: "备注", dataIndex: "remark", ellipsis: true },
    { title: "创建时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 140,
      align: "center",
      render: (_, row) => (
        <Space>
          <PermissionGuard permission="system:dict:update">
            <Button type="link" size="small" onClick={() => onEdit(row.id!)}>修改</Button>
          </PermissionGuard>
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
