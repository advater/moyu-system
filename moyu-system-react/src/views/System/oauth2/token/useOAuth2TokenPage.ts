import { Modal, message } from "antd";
import { useCrudList } from "@/hooks/useCrudList";
import * as OAuth2TokenApi from "@/api/system/oauth2/token";
import type { OAuth2TokenVO } from "@/api/system/oauth2/token";

export function useOAuth2TokenPage() {
  const crud = useCrudList<OAuth2TokenVO>((params) =>
    OAuth2TokenApi.getOnlineUserPage({
      page: params.page,
      pageSize: params.pageSize,
      userId: params.userId ? Number(params.userId) : undefined,
      userType: params.userType,
      clientId: params.clientId,
    }),
  );
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();

  const handleDelete = (accessToken: string) => {
    modal.confirm({
      title: "提示",
      content: "确认强制退出该令牌？",
      onOk: async () => {
        await OAuth2TokenApi.deleteAccessToken(accessToken);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleForceLogout = (userId?: number, userType?: number) => {
    if (userId == null) return;
    modal.confirm({
      title: "提示",
      content: "确认强制下线该用户的全部有效会话？",
      onOk: async () => {
        await OAuth2TokenApi.forceLogout(userId, userType);
        messageApi.success("已强制下线");
        crud.getList();
      },
    });
  };

  return {
    ...crud,
    modalHolder,
    messageHolder,
    handleDelete,
    handleForceLogout,
  };
}
