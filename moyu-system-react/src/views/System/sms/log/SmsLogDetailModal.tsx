import { Descriptions, Modal } from "antd";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { SmsLogVO } from "@/api/system/sms/smsLog";

export default function SmsLogDetailModal({
  detail,
  onClose,
}: {
  detail: SmsLogVO | null;
  onClose: () => void;
}) {
  return (
    <Modal open={!!detail} title="短信日志详情" footer={null} onCancel={onClose} width={720}>
      {detail && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="日志编号">{detail.id}</Descriptions.Item>
          <Descriptions.Item label="手机号">{detail.mobile}</Descriptions.Item>
          <Descriptions.Item label="短信内容">{detail.templateContent}</Descriptions.Item>
          <Descriptions.Item label="发送状态">
            <DictTag type={DICT_TYPE.SYSTEM_SMS_SEND_STATUS} value={detail.sendStatus} />
          </Descriptions.Item>
          <Descriptions.Item label="接收状态">
            <DictTag type={DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS} value={detail.receiveStatus} />
          </Descriptions.Item>
          <Descriptions.Item label="API 发送结果">
            {detail.apiSendCode} {detail.apiSendMsg}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatLocalDateTime(detail.createTime)}</Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
