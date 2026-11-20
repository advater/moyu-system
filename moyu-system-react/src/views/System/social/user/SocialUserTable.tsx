import { Button, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import PermissionGuard from "@/components/PermissionGuard";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { SocialUserVO } from "@/api/system/social/user";

export default function SocialUserTable({
  loading,
  list,
  onDetail,
}: {
  loading: boolean;
  list: SocialUserVO[];
  onDetail: (row: SocialUserVO) => void;
}) {
  const columns: ColumnsType<SocialUserVO> = [
    { title: "编号", dataIndex: "id", width: 80, align: "center" },
    { title: "社交平台", dataIndex: "type", align: "center", render: (v) => <DictTag type={DICT_TYPE.SYSTEM_SOCIAL_TYPE} value={v} /> },
    { title: "昵称", dataIndex: "nickname", align: "center" },
    { title: "openid", dataIndex: "openid", ellipsis: true },
    { title: "创建时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 80,
      align: "center",
      render: (_, row) => (
        <PermissionGuard permission="system:social-user:query">
          <Button type="link" size="small" onClick={() => onDetail(row)}>详情</Button>
        </PermissionGuard>
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
    />
  );
}
