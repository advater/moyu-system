import { Descriptions, Modal } from "antd";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { NotifyMessageVO } from "@/api/system/notify/message";

export default function MyNotifyDetailModal({
  detail,
  onClose,
}: {
  detail: NotifyMessageVO | null;
  onClose: () => void;
}) {
  return (
    <Modal open={!!detail} title="站内信详情" footer={null} onCancel={onClose} width={640}>
      {detail && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="发送人">{detail.templateNickname}</Descriptions.Item>
          <Descriptions.Item label="发送时间">{formatLocalDateTime(detail.createTime)}</Descriptions.Item>
          <Descriptions.Item label="消息内容">{detail.templateContent}</Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
