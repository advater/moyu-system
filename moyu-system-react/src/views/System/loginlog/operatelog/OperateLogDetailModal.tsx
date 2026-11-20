import { Descriptions, Modal } from "antd";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { OperateLogVO } from "@/api/system/operatelog";

export default function OperateLogDetailModal({
  detail,
  onClose,
}: {
  detail: OperateLogVO | null;
  onClose: () => void;
}) {
  return (
    <Modal open={!!detail} title="详情" footer={null} onCancel={onClose} width={800}>
      {detail && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="日志主键">{detail.id}</Descriptions.Item>
          {detail.traceId && <Descriptions.Item label="链路追踪">{detail.traceId}</Descriptions.Item>}
          <Descriptions.Item label="操作人编号">{detail.userId}</Descriptions.Item>
          <Descriptions.Item label="操作人名字">{detail.userName}</Descriptions.Item>
          <Descriptions.Item label="操作人 IP">{detail.userIp}</Descriptions.Item>
          <Descriptions.Item label="操作人 UA">{detail.userAgent}</Descriptions.Item>
          <Descriptions.Item label="操作模块">{detail.type}</Descriptions.Item>
          <Descriptions.Item label="操作名">{detail.subType}</Descriptions.Item>
          <Descriptions.Item label="操作内容">{detail.action}</Descriptions.Item>
          {detail.extra && <Descriptions.Item label="操作拓展参数">{detail.extra}</Descriptions.Item>}
          <Descriptions.Item label="请求 URL">
            {detail.requestMethod} {detail.requestUrl}
          </Descriptions.Item>
          <Descriptions.Item label="操作时间">{formatLocalDateTime(detail.createTime)}</Descriptions.Item>
          <Descriptions.Item label="业务编号">{detail.bizId}</Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
