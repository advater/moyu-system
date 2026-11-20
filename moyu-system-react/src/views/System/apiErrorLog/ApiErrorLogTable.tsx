import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import PermissionGuard from "@/components/PermissionGuard";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { ApiErrorLogVO } from "@/api/system/apiErrorLog";

export default function ApiErrorLogTable({
  loading,
  list,
  onDetail,
  onProcess,
}: {
  loading: boolean;
  list: ApiErrorLogVO[];
  onDetail: (row: ApiErrorLogVO) => void;
  onProcess: (row: ApiErrorLogVO, processStatus: number) => void;
}) {
  const columns: ColumnsType<ApiErrorLogVO> = [
    { title: "日志编号", dataIndex: "id", width: 90, align: "center" },
    { title: "用户编号", dataIndex: "userId", width: 90, align: "center" },
    { title: "应用名", dataIndex: "applicationName", width: 140, align: "center" },
    { title: "请求地址", dataIndex: "requestUrl", ellipsis: true },
    { title: "异常名", dataIndex: "exceptionName", ellipsis: true },
    { title: "处理状态", dataIndex: "processStatus", width: 100, align: "center", render: (v) => <DictTag type={DICT_TYPE.INFRA_API_ERROR_LOG_PROCESS_STATUS} value={v} /> },
    { title: "异常时间", dataIndex: "exceptionTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 200,
      align: "center",
      render: (_, row) => (
        <Space>
          <PermissionGuard permission="system:api-error-log:query">
            <Button type="link" size="small" onClick={() => onDetail(row)}>详情</Button>
          </PermissionGuard>
          {row.processStatus === 0 && (
            <PermissionGuard permission="system:api-error-log:update">
              <Button type="link" size="small" onClick={() => onProcess(row, 1)}>已处理</Button>
              <Button type="link" size="small" onClick={() => onProcess(row, 2)}>已忽略</Button>
            </PermissionGuard>
          )}
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
      scroll={{ x: 1200 }}
    />
  );
}
