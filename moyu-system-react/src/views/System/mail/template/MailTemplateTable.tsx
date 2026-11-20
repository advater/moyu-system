import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import StatusSwitch from "@/components/StatusSwitch";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { MailTemplateVO } from "@/api/system/mail/template";

export function MailTemplateToolbar({
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
      <PermissionGuard permission="system:mail-template:create">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增</Button>
      </PermissionGuard>
      <PermissionGuard permission="system:mail-template:delete">
        <Button danger icon={<DeleteOutlined />} disabled={!selectedCount} onClick={onDeleteBatch}>批量删除</Button>
      </PermissionGuard>
    </Space>
  );
}

export default function MailTemplateTable({
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
  list: MailTemplateVO[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onSend: (row: MailTemplateVO) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStatusChange: (row: MailTemplateVO, status: number) => void;
}) {
  const columns: ColumnsType<MailTemplateVO> = [
    { title: "编号", dataIndex: "id", width: 80, align: "center" },
    { title: "模板编码", dataIndex: "code", align: "center" },
    { title: "模板名称", dataIndex: "name", align: "center" },
    { title: "模板标题", dataIndex: "title", ellipsis: true },
    { title: "开启状态", dataIndex: "status", width: 90, align: "center", render: (_, row) => (
      <StatusSwitch value={row.status} permission="system:mail-template:update" onChange={(status) => onStatusChange(row, status)} />
    ) },
    { title: "创建时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 200,
      align: "center",
      render: (_, row) => (
        <Space>
          <PermissionGuard permission="system:mail-template:send-mail">
            <Button type="link" size="small" onClick={() => onSend(row)}>测试</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:mail-template:update">
            <Button type="link" size="small" onClick={() => onEdit(row.id!)}>修改</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:mail-template:delete">
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
