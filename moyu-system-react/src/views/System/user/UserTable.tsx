import { useMemo } from "react";
import { Button, Space, Switch, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import PermissionGuard from "@/components/PermissionGuard";
import { usePermission } from "@/hooks/usePermission";
import { CommonStatusEnum } from "@/utils/constants";
import { isProtectedAdminUser } from "@/utils/systemProtect";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { UserVO } from "@/api/system/user/types";

export default function UserTable({
  loading,
  list,
  selectedIds,
  onSelect,
  onEdit,
  onDelete,
  onResetPwd,
  onAssignRole,
  onStatusChange,
}: {
  loading: boolean;
  list: UserVO[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onResetPwd: (row: UserVO) => void;
  onAssignRole: (row: UserVO) => void;
  onStatusChange: (row: UserVO, checked: boolean) => void;
}) {
  const { hasPermission } = usePermission();

  const columns: ColumnsType<UserVO> = useMemo(
    () => [
      { title: "用户编号", dataIndex: "id", width: 90, align: "center" },
      { title: "用户名称", dataIndex: "username", align: "center" },
      { title: "用户昵称", dataIndex: "nickname", align: "center" },
      { title: "部门", dataIndex: "deptName", align: "center", render: (v) => v || "-" },
      { title: "手机号码", dataIndex: "mobile", width: 120, align: "center" },
      {
        title: "状态",
        dataIndex: "status",
        width: 90,
        align: "center",
        render: (_, row) => {
          const locked = isProtectedAdminUser(row.username);
          return locked ? null : (
            <Switch
              size="small"
              checked={row.status === CommonStatusEnum.ENABLE}
              disabled={!hasPermission("system:user:update")}
              onChange={(checked) => onStatusChange(row, checked)}
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
        width: 220,
        align: "center",
        fixed: "right",
        render: (_, row) => {
          const locked = isProtectedAdminUser(row.username);
          return (
            <Space>
              <PermissionGuard permission="system:user:update">
                <Button type="link" size="small" onClick={() => onEdit(row.id)}>
                  修改
                </Button>
              </PermissionGuard>
              {!locked && (
                <PermissionGuard permission="system:user:delete">
                  <Button type="link" size="small" danger onClick={() => onDelete(row.id)}>
                    删除
                  </Button>
                </PermissionGuard>
              )}
              <PermissionGuard permission="system:user:update-password">
                <Button type="link" size="small" onClick={() => onResetPwd(row)}>
                  重置密码
                </Button>
              </PermissionGuard>
              <PermissionGuard permission="system:permission:assign-user-role">
                <Button type="link" size="small" onClick={() => onAssignRole(row)}>
                  分配角色
                </Button>
              </PermissionGuard>
            </Space>
          );
        },
      },
    ],
    [hasPermission, onAssignRole, onDelete, onEdit, onResetPwd, onStatusChange],
  );

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={list}
      pagination={false}
      rowSelection={{
        selectedRowKeys: selectedIds,
        onChange: (keys) => onSelect(keys as number[]),
        getCheckboxProps: (row) => ({ disabled: isProtectedAdminUser(row.username) }),
      }}
      scroll={{ x: 1100 }}
    />
  );
}
