import { Descriptions, Modal } from "antd";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import type { SocialUserVO } from "@/api/system/social/user";

export default function SocialUserDetailModal({
  detail,
  onClose,
}: {
  detail: SocialUserVO | null;
  onClose: () => void;
}) {
  return (
    <Modal open={!!detail} title="社交用户详情" footer={null} onCancel={onClose} width={720}>
      {detail && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="编号">{detail.id}</Descriptions.Item>
          <Descriptions.Item label="社交平台"><DictTag type={DICT_TYPE.SYSTEM_SOCIAL_TYPE} value={detail.type} /></Descriptions.Item>
          <Descriptions.Item label="昵称">{detail.nickname}</Descriptions.Item>
          <Descriptions.Item label="openid">{detail.openid}</Descriptions.Item>
          <Descriptions.Item label="原始用户信息"><pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{detail.rawUserInfo}</pre></Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
