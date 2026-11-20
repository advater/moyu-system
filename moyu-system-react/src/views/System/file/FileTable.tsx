import { Button, Space, Table, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { FileVO } from "@/api/system/file";

function formatSize(size?: number) {
  if (size == null) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function FileToolbar({
  selectedCount,
  onUpload,
  onDeleteBatch,
  uploadPercent,
  onAbortUpload,
}: {
  selectedCount: number;
  onUpload: (file: File) => Promise<void>;
  onDeleteBatch: () => void;
  uploadPercent?: number | null;
  onAbortUpload?: () => void;
}) {
  return (
    <Space>
      <PermissionGuard permission="system:file:create">
        <Upload
          showUploadList={false}
          beforeUpload={async (file) => {
            await onUpload(file);
            return false;
          }}
        >
          <Button type="primary" icon={<UploadOutlined />} loading={uploadPercent != null}>
            {uploadPercent != null ? `上传中 ${uploadPercent}%` : "上传文件"}
          </Button>
        </Upload>
      </PermissionGuard>
      {uploadPercent != null && (
        <Button onClick={onAbortUpload}>取消上传</Button>
      )}
      <PermissionGuard permission="system:file:delete">
        <Button danger icon={<DeleteOutlined />} disabled={!selectedCount} onClick={onDeleteBatch}>批量删除</Button>
      </PermissionGuard>
    </Space>
  );
}

export default function FileTable({
  loading,
  list,
  selectedIds,
  onSelect,
  onPreview,
  onDownload,
  onDelete,
}: {
  loading: boolean;
  list: FileVO[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onPreview: (row: FileVO) => void;
  onDownload: (row: FileVO) => void;
  onDelete: (id: number) => void;
}) {
  const columns: ColumnsType<FileVO> = [
    { title: "编号", dataIndex: "id", width: 80, align: "center" },
    { title: "文件名", dataIndex: "name", ellipsis: true },
    { title: "路径", dataIndex: "path", ellipsis: true },
    { title: "大小", dataIndex: "size", width: 110, align: "center", render: (v) => formatSize(v) },
    { title: "类型", dataIndex: "type", width: 140, align: "center" },
    { title: "创建时间", dataIndex: "createTime", width: 180, align: "center", render: (v) => formatLocalDateTime(v) },
    {
      title: "操作",
      key: "action",
      width: 200,
      align: "center",
      render: (_, row) => (
        <Space>
          <Button type="link" size="small" onClick={() => onPreview(row)}>预览</Button>
          <Button type="link" size="small" onClick={() => onDownload(row)}>下载</Button>
          <PermissionGuard permission="system:file:delete">
            <Button type="link" size="small" danger onClick={() => onDelete(row.id)}>删除</Button>
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
      rowSelection={{ selectedRowKeys: selectedIds, onChange: (keys) => onSelect(keys as number[]) }}
    />
  );
}
