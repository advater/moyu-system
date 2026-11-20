import { Descriptions, Modal } from "antd";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { LoginLogVO } from "@/api/system/loginLog";

export default function LoginLogDetailModal({
  detail,
  onClose,
}: {
  detail: LoginLogVO | null;
  onClose: () => void;
}) {
  return (
    <Modal open={!!detail} title="详情" footer={null} onCancel={onClose} width={720}>
      {detail && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="日志编号">{detail.id}</Descriptions.Item>
          <Descriptions.Item label="登录类型">
            <DictTag type={DICT_TYPE.SYSTEM_LOGIN_TYPE} value={detail.logType} />
          </Descriptions.Item>
          <Descriptions.Item label="用户名称">{detail.username}</Descriptions.Item>
          <Descriptions.Item label="登录地址">{detail.userIp}</Descriptions.Item>
          <Descriptions.Item label="浏览器">{detail.userAgent}</Descriptions.Item>
          <Descriptions.Item label="登陆结果">
            <DictTag type={DICT_TYPE.SYSTEM_LOGIN_RESULT} value={detail.result} />
          </Descriptions.Item>
          <Descriptions.Item label="登录日期">{formatLocalDateTime(detail.createTime)}</Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
