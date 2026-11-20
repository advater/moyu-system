import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, DownloadOutlined, PlusOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import DictTag from "@/components/DictTag";
import StatusSwitch from "@/components/StatusSwitch";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { RoleVO } from "@/api/system/role";
import { SystemRoleTypeEnum } from "@/utils/constants";

export function RoleToolbar({
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
      <PermissionGuard permission="system:role:create">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增</Button>
      </PermissionGuard>
      <PermissionGuard permission="system:role:export">
        <Button icon={<DownloadOutlined />} onClick={onExport}>导出</Button>
      </PermissionGuard>
      <PermissionGuard permission="system:role:delete">
        <Button danger icon={<DeleteOutlined />} disabled={!selectedCount} onClick={onDeleteBatch}>批量删除</Button>
      </PermissionGuard>
    </Space>
  );
}

export default function RoleTable({
  loading,
  list,
  selectedIds,
  onSelect,
  onEdit,
  onAssignMenu,
  onAssignData,
  onCopy,
  onDelete,
  onStatusChange,
}: {
  loading: boolean;
  list: RoleVO[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onEdit: (id: number) => void;
  onAssignMenu: (row: RoleVO) => void;
  onAssignData: (row: RoleVO) => void;
  onCopy: (row: RoleVO) => void;
  onDelete: (id: number) => void;
  onStatusChange: (row: RoleVO, status: number) => void;
}) {
  const columns: ColumnsType<RoleVO> = [
    { title: "角色编号", dataIndex: "id", width: 90, align: "center" },
    { title: "角色名称", dataIndex: "name", align: "center" },
    {
      title: "角色类型",
      dataIndex: "type",
      align: "center",
      render: (v) => <DictTag type={DICT_TYPE.SYSTEM_ROLE_TYPE} value={v} />,
    },
    { title: "角色标识", dataIndex: "code", align: "center" },
    { title: "显示顺序", dataIndex: "sort", align: "center" },
    { title: "备注", dataIndex: "remark", align: "center", ellipsis: true },
    {
      title: "状态",
      dataIndex: "status",
      align: "center",
      render: (_, row) => {
        const locked = row.type === SystemRoleTypeEnum.SYSTEM;
        return locked ? null : (
          <StatusSwitch
            value={row.status}
            permission="system:role:update"
            onChange={(status) => onStatusChange(row, status)}
          />
        );
      },
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      width: 180,
      align: "center",
      render: (v) => formatLocalDateTime(v),
    },
    {
      title: "操作",
      key: "action",
      width: 330,
      fixed: "right",
      align: "center",
      render: (_, row) => {
        const locked = row.type === SystemRoleTypeEnum.SYSTEM;
        return (
          <Space>
            <PermissionGuard permission="system:role:update">
              <Button type="link" size="small" onClick={() => onEdit(row.id!)}>
                编辑
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="system:permission:assign-role-menu">
              <Button type="link" size="small" onClick={() => onAssignMenu(row)}>
                菜单权限
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="system:permission:assign-role-data-scope">
              <Button type="link" size="small" onClick={() => onAssignData(row)}>
                数据权限
              </Button>
            </PermissionGuard>
            {!locked && (
              <PermissionGuard permission="system:role:create">
                <Button type="link" size="small" onClick={() => onCopy(row)}>
                  复制
                </Button>
              </PermissionGuard>
            )}
            {!locked && (
              <PermissionGuard permission="system:role:delete">
                <Button type="link" size="small" danger onClick={() => onDelete(row.id!)}>
                  删除
                </Button>
              </PermissionGuard>
            )}
          </Space>
        );
      },
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
      scroll={{ x: 1100 }}
    />
  );
}
