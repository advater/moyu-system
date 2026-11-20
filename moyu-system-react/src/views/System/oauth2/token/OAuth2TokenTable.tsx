import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import PermissionGuard from "@/components/PermissionGuard";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { OAuth2TokenVO } from "@/api/system/oauth2/token";

export default function OAuth2TokenTable({
  loading,
  list,
  onDelete,
  onForceLogout,
}: {
  loading: boolean;
  list: OAuth2TokenVO[];
  onDelete: (accessToken: string) => void;
  onForceLogout: (userId?: number, userType?: number) => void;
}) {
  const columns: ColumnsType<OAuth2TokenVO> = [
    { title: "访问令牌", dataIndex: "accessToken", ellipsis: true },
    { title: "刷新令牌", dataIndex: "refreshToken", ellipsis: true },
    { title: "用户编号", dataIndex: "userId", width: 100, align: "center" },
    { title: "用户类型", dataIndex: "userType", width: 100, align: "center", render: (v) => <DictTag type={DICT_TYPE.USER_TYPE} value={v} /> },
    { title: "客户端编号", dataIndex: "clientId", width: 140, align: "center" },
    { title: "过期时间", dataIndex: "expiresTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    { title: "创建时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 160,
      align: "center",
      render: (_, row) => (
        <PermissionGuard permission="system:oauth2-token:delete">
          <Space>
            <Button type="link" size="small" danger onClick={() => onDelete(row.accessToken)}>
              吊销令牌
            </Button>
            <Button type="link" size="small" danger onClick={() => onForceLogout(row.userId, row.userType)}>
              强制下线
            </Button>
          </Space>
        </PermissionGuard>
      ),
    },
  ];

  return (
    <Table
      rowKey="accessToken"
      loading={loading}
      columns={columns}
      dataSource={list}
      pagination={false}
      scroll={{ x: 1200 }}
    />
  );
}
