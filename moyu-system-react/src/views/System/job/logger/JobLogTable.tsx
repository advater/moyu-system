import { Button, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { JobLogVO } from "@/api/system/jobLog";

export default function JobLogTable({
  loading,
  list,
  onDetail,
}: {
  loading: boolean;
  list: JobLogVO[];
  onDetail: (row: JobLogVO) => void;
}) {
  const columns: ColumnsType<JobLogVO> = [
    { title: "日志编号", dataIndex: "id", width: 90, align: "center" },
    { title: "任务编号", dataIndex: "jobId", width: 90, align: "center" },
    { title: "处理器名字", dataIndex: "handlerName", ellipsis: true },
    { title: "执行次数", dataIndex: "executeIndex", width: 90, align: "center" },
    { title: "执行时间", dataIndex: "beginTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    { title: "时长(ms)", dataIndex: "duration", width: 100, align: "center" },
    { title: "状态", dataIndex: "status", width: 90, align: "center", render: (v) => <DictTag type={DICT_TYPE.INFRA_JOB_LOG_STATUS} value={v} /> },
    {
      title: "操作",
      key: "action",
      width: 80,
      align: "center",
      render: (_, row) => <Button type="link" size="small" onClick={() => onDetail(row)}>详情</Button>,
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
