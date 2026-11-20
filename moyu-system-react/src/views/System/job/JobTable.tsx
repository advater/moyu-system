import { Button, Space, Switch, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { JobVO } from "@/api/system/job";

export function JobToolbar({
  onCreate,
  onLogs,
}: {
  onCreate: () => void;
  onLogs: () => void;
}) {
  return (
    <Space>
      <PermissionGuard permission="system:job:create">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增</Button>
      </PermissionGuard>
      <PermissionGuard permission="system:job:query">
        <Button onClick={onLogs}>执行日志</Button>
      </PermissionGuard>
    </Space>
  );
}

export default function JobTable({
  loading,
  list,
  onEdit,
  onStatusChange,
  onTrigger,
  onDetail,
  onLogs,
  onDelete,
}: {
  loading: boolean;
  list: JobVO[];
  onEdit: (id: number) => void;
  onStatusChange: (id: number, checked: boolean) => void;
  onTrigger: (row: JobVO) => void;
  onDetail: (row: JobVO) => void;
  onLogs: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const columns: ColumnsType<JobVO> = [
    { title: "任务编号", dataIndex: "id", width: 90, align: "center" },
    { title: "任务名称", dataIndex: "name", align: "center" },
    { title: "处理器名字", dataIndex: "handlerName", ellipsis: true },
    { title: "CRON", dataIndex: "cronExpression", width: 140, align: "center" },
    { title: "状态", dataIndex: "status", width: 90, align: "center", render: (v) => <DictTag type={DICT_TYPE.INFRA_JOB_STATUS} value={v} /> },
    {
      title: "启停",
      key: "toggle",
      width: 80,
      align: "center",
      render: (_, row) => (
        <PermissionGuard permission="system:job:update">
          <Switch checked={row.status === 1} onChange={(checked) => onStatusChange(row.id!, checked)} />
        </PermissionGuard>
      ),
    },
    { title: "创建时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 260,
      align: "center",
      render: (_, row) => (
        <Space>
          <PermissionGuard permission="system:job:update">
            <Button type="link" size="small" onClick={() => onEdit(row.id!)}>修改</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:job:trigger">
            <Button type="link" size="small" onClick={() => onTrigger(row)}>执行一次</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:job:query">
            <Button type="link" size="small" onClick={() => onDetail(row)}>详情</Button>
            <Button type="link" size="small" onClick={() => onLogs(row.id!)}>日志</Button>
          </PermissionGuard>
          <PermissionGuard permission="system:job:delete">
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
      scroll={{ x: 1200 }}
    />
  );
}
