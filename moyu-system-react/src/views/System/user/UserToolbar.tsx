import { Button, Space } from "antd";
import { DeleteOutlined, DownloadOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import PermissionGuard from "@/components/PermissionGuard";

export default function UserToolbar({
  selectedCount,
  exportLoading,
  onCreate,
  onImport,
  onExport,
  onDeleteBatch,
}: {
  selectedCount: number;
  exportLoading: boolean;
  onCreate: () => void;
  onImport: () => void;
  onExport: () => void;
  onDeleteBatch: () => void;
}) {
  return (
    <Space>
      <PermissionGuard permission="system:user:create">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          新增
        </Button>
      </PermissionGuard>
      <PermissionGuard permission="system:user:import">
        <Button icon={<UploadOutlined />} onClick={onImport}>
          导入
        </Button>
      </PermissionGuard>
      <PermissionGuard permission="system:user:export">
        <Button icon={<DownloadOutlined />} loading={exportLoading} onClick={onExport}>
          导出
        </Button>
      </PermissionGuard>
      <PermissionGuard permission="system:user:delete">
        <Button danger icon={<DeleteOutlined />} disabled={!selectedCount} onClick={onDeleteBatch}>
          批量删除
        </Button>
      </PermissionGuard>
    </Space>
  );
}
