import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";

export default function AreaTable({
  loading,
  list,
}: {
  loading: boolean;
  list: any[];
}) {
  const columns: ColumnsType<any> = [
    { title: "编号", dataIndex: "id", width: 100 },
    { title: "地名", dataIndex: "name" },
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={list}
      pagination={false}
      expandable={{ defaultExpandAllRows: false }}
    />
  );
}
