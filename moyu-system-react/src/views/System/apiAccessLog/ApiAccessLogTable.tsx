import { Button, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import PermissionGuard from "@/components/PermissionGuard";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { ApiAccessLogVO } from "@/api/system/apiAccessLog";

export default function ApiAccessLogTable({
  loading,
  list,
  onDetail,
}: {
  loading: boolean;
  list: ApiAccessLogVO[];
  onDetail: (row: ApiAccessLogVO) => void;
}) {
  const columns: ColumnsType<ApiAccessLogVO> = [
    { title: "日志编号", dataIndex: "id", width: 90, align: "center" },
    { title: "用户编号", dataIndex: "userId", width: 90, align: "center" },
    { title: "用户类型", dataIndex: "userType", width: 90, align: "center", render: (v) => <DictTag type={DICT_TYPE.USER_TYPE} value={v} /> },
    { title: "应用名", dataIndex: "applicationName", width: 140, align: "center" },
    { title: "请求方法", dataIndex: "requestMethod", width: 90, align: "center" },
    { title: "请求地址", dataIndex: "requestUrl", ellipsis: true },
    { title: "耗时", dataIndex: "duration", width: 90, align: "center", render: (v) => (v != null ? `${v} ms` : "-") },
    { title: "操作时间", dataIndex: "beginTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 80,
      align: "center",
      render: (_, row) => (
        <PermissionGuard permission="system:api-access-log:query">
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
      scroll={{ x: 1200 }}
    />
  );
}
