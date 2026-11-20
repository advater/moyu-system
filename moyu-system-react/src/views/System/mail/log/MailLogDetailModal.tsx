import { Descriptions, Modal } from "antd";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { MailLogVO } from "@/api/system/mail/log";

export default function MailLogDetailModal({
  detail,
  onClose,
}: {
  detail: MailLogVO | null;
  onClose: () => void;
}) {
  return (
    <Modal open={!!detail} title="邮件日志详情" footer={null} onCancel={onClose} width={720}>
      {detail && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="日志编号">{detail.id}</Descriptions.Item>
          <Descriptions.Item label="接收邮箱">
            {Array.isArray(detail.toMails) ? detail.toMails.join(", ") : detail.toMails}
          </Descriptions.Item>
          <Descriptions.Item label="邮件标题">{detail.templateTitle}</Descriptions.Item>
          <Descriptions.Item label="邮件内容">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{detail.templateContent || "-"}</pre>
          </Descriptions.Item>
          <Descriptions.Item label="发送状态">
            <DictTag type={DICT_TYPE.SYSTEM_MAIL_SEND_STATUS} value={detail.sendStatus} />
          </Descriptions.Item>
          <Descriptions.Item label="异常信息">{detail.sendException || "-"}</Descriptions.Item>
          <Descriptions.Item label="发送时间">{formatLocalDateTime(detail.sendTime)}</Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
