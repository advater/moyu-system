import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { MailTemplateVO, MailSendReqVO } from "./types";
export type { MailTemplateVO, MailSendReqVO };

// 查询邮件模版精简列表
export const getSimpleMailTemplateList = () => {
  return request.get<MailTemplateVO[]>({ url: "/mail-template/simple-list" });
};

// 查询邮件模版列表
export const getMailTemplatePage = (params: PageParam) => {
  return request.get<{ list: MailTemplateVO[]; total: number }>({
    url: "/mail-template/page",
    params,
  });
};

// 查询邮件模版详情
export const getMailTemplate = (id: number) => {
  return request.get<MailTemplateVO>({ url: "/mail-template/get", params: { id } });
};

// 新增邮件模版
export const createMailTemplate = (data: Partial<MailTemplateVO>) => {
  return request.post({ url: "/mail-template/create", data });
};

// 修改邮件模版
export const updateMailTemplate = (data: Partial<MailTemplateVO>) => {
  return request.put({ url: "/mail-template/update", data });
};

// 删除邮件模版
export const deleteMailTemplate = (id: number) => {
  return request.delete({ url: "/mail-template/delete", params: { id } });
};

// 批量删除邮件模版
export const deleteMailTemplateList = (ids: number[]) => {
  return request.delete({ url: "/mail-template/delete-list", params: { ids: ids.join(",") } });
};

// 发送邮件
export const sendMail = (data: MailSendReqVO) => {
  return request.post({ url: "/mail-template/send-mail", data });
};
