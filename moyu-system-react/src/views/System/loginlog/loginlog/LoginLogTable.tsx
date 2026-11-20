import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DownloadOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { LoginLogVO } from "@/api/system/loginLog";

export function LoginLogToolbar({
  exportLoading,
  onExport,
}: {
  exportLoading: boolean;
  onExport: () => void;
}) {
  return (
    <Space>
      <PermissionGuard permission="system:login-log:export">
        <Button icon={<DownloadOutlined />} loading={exportLoading} onClick={onExport}>导出</Button>
      </PermissionGuard>
    </Space>
  );
}

export default function LoginLogTable({
  loading,
  list,
  onDetail,
}: {
  loading: boolean;
  list: LoginLogVO[];
  onDetail: (row: LoginLogVO) => void;
}) {
  const columns: ColumnsType<LoginLogVO> = [
    { title: "日志编号", dataIndex: "id", align: "center" },
    { title: "登录类型", dataIndex: "logType", align: "center", render: (v) => <DictTag type={DICT_TYPE.SYSTEM_LOGIN_TYPE} value={v} /> },
    { title: "用户名称", dataIndex: "username", width: 180, align: "center" },
    { title: "登录地址", dataIndex: "userIp", width: 180, align: "center" },
    { title: "浏览器", dataIndex: "userAgent", ellipsis: true },
    { title: "登陆结果", dataIndex: "result", align: "center", render: (v) => <DictTag type={DICT_TYPE.SYSTEM_LOGIN_RESULT} value={v} /> },
    { title: "登录日期", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 80,
      align: "center",
      render: (_, row) => (
        <PermissionGuard permission="system:login-log:query">
          <Button type="link" size="small" onClick={() => onDetail(row)}>详情</Button>
        </PermissionGuard>
      ),
    },
  ];

  return (
    <Table rowKey="id" loading={loading} columns={columns} dataSource={list} pagination={false} />
  );
}
