import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import StatusSwitch from "@/components/StatusSwitch";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { NotifyTemplateVO } from "@/api/system/notify/template";

export function NotifyTemplateToolbar({
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
      <PermissionGuard permission="system:notify-template:create">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增</Button>
      </PermissionGuard>
      <PermissionGuard permission="system:notify-template:delete">
        <Button danger icon={<DeleteOutlined />} disabled={!selectedCount} onClick={onDeleteBatch}>批量删除</Button>
      </PermissionGuard>
    </Space>
  );
}

export default function NotifyTemplateTable({
  loading,
  list,
  selectedIds,
  onSelect,
  onSend,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  loading: boolean;
  list: NotifyTemplateVO[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onSend: (row: NotifyTemplateVO) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStatusChange: (row: NotifyTemplateVO, status: number) => void;
}) {
  const columns: ColumnsType<NotifyTemplateVO> = [
    { title: "编号", dataIndex: "id", width: 80, align: "center" },
    { title: "模板编码", dataIndex: "code", align: "center" },
    { title: "模板名称", dataIndex: "name", align: "center" },
    { title: "类型", dataIndex: "type", align: "center", render: (v) => <DictTag type={DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE} value={v} /> },
    { title: "发送人", dataIndex: "nickname", align: "center" },
    { title: "开启状态", dataIndex: "status", width: 90, align: "center", render: (_, row) => (
      <StatusSwitch value={row.status} permission="system:notify-template:update" onChange={(status) => onStatusChange(row, status)} />
    ) },
    { title: "创建时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 200,
      align: "center",
      render: (_, row) => (
        <Space>
          <PermissionGuard permission="system:notify-template:send-notify">
            <Button type="link" size="small" onClick={() => onSend(row)}>测试</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:notify-template:update">
            <Button type="link" size="small" onClick={() => onEdit(row.id!)}>修改</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:notify-template:delete">
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
