import { Descriptions, Modal } from "antd";
import type { ApiErrorLogVO } from "@/api/system/apiErrorLog";

export default function ApiErrorLogDetailModal({
  detail,
  onClose,
}: {
  detail: ApiErrorLogVO | null;
  onClose: () => void;
}) {
  return (
    <Modal open={!!detail} title="异常日志详情" footer={null} onCancel={onClose} width={860}>
      {detail && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="日志编号">{detail.id}</Descriptions.Item>
          <Descriptions.Item label="链路追踪">{detail.traceId}</Descriptions.Item>
          <Descriptions.Item label="用户编号">{detail.userId}</Descriptions.Item>
          <Descriptions.Item label="应用名">{detail.applicationName}</Descriptions.Item>
          <Descriptions.Item label="请求信息">{detail.requestMethod} {detail.requestUrl}</Descriptions.Item>
          <Descriptions.Item label="异常名">{detail.exceptionName}</Descriptions.Item>
          <Descriptions.Item label="异常信息">{detail.exceptionMessage}</Descriptions.Item>
          <Descriptions.Item label="堆栈"><pre style={{ whiteSpace: "pre-wrap", maxHeight: 280, overflow: "auto", margin: 0 }}>{detail.exceptionStackTrace}</pre></Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
