import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DownloadOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { OperateLogVO } from "@/api/system/operatelog";

export function OperateLogToolbar({
  exportLoading,
  onExport,
}: {
  exportLoading: boolean;
  onExport: () => void;
}) {
  return (
    <Space>
      <PermissionGuard permission="system:operate-log:export">
        <Button icon={<DownloadOutlined />} loading={exportLoading} onClick={onExport}>导出</Button>
      </PermissionGuard>
    </Space>
  );
}

export default function OperateLogTable({
  loading,
  list,
  onDetail,
}: {
  loading: boolean;
  list: OperateLogVO[];
  onDetail: (row: OperateLogVO) => void;
}) {
  const columns: ColumnsType<OperateLogVO> = [
    { title: "日志编号", dataIndex: "id", width: 100, align: "center" },
    { title: "操作人", dataIndex: "userName", width: 120, align: "center" },
    { title: "操作模块", dataIndex: "type", width: 120, align: "center" },
    { title: "操作名", dataIndex: "subType", width: 160, align: "center" },
    { title: "操作内容", dataIndex: "action", ellipsis: true },
    { title: "操作时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    { title: "业务编号", dataIndex: "bizId", width: 120, align: "center" },
    { title: "操作 IP", dataIndex: "userIp", width: 120, align: "center" },
    {
      title: "操作",
      key: "action",
      width: 80,
      fixed: "right",
      align: "center",
      render: (_, row) => (
        <PermissionGuard permission="system:operate-log:query">
          <Button type="link" size="small" onClick={() => onDetail(row)}>详情</Button>
        </PermissionGuard>
      ),
    },
  ];

  return (
    <Table rowKey="id" loading={loading} columns={columns} dataSource={list} pagination={false} scroll={{ x: 1200 }} />
  );
}
