import { Descriptions, Modal } from "antd";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { ApiAccessLogVO } from "@/api/system/apiAccessLog";

export default function ApiAccessLogDetailModal({
  detail,
  onClose,
}: {
  detail: ApiAccessLogVO | null;
  onClose: () => void;
}) {
  return (
    <Modal open={!!detail} title="访问日志详情" footer={null} onCancel={onClose} width={800}>
      {detail && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="日志编号">{detail.id}</Descriptions.Item>
          <Descriptions.Item label="链路追踪">{detail.traceId}</Descriptions.Item>
          <Descriptions.Item label="用户编号">{detail.userId}</Descriptions.Item>
          <Descriptions.Item label="应用名">{detail.applicationName}</Descriptions.Item>
          <Descriptions.Item label="请求信息">{detail.requestMethod} {detail.requestUrl}</Descriptions.Item>
          <Descriptions.Item label="请求参数"><pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{detail.requestParams}</pre></Descriptions.Item>
          <Descriptions.Item label="用户 IP">{detail.userIp}</Descriptions.Item>
          <Descriptions.Item label="开始时间">{formatLocalDateTime(detail.beginTime)}</Descriptions.Item>
          <Descriptions.Item label="执行时长">{detail.duration} ms</Descriptions.Item>
          <Descriptions.Item label="结果码">{detail.resultCode} {detail.resultMsg}</Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
