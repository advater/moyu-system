import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { SmsTemplateVO, SendSmsReqVO } from "./types";
export type { SmsTemplateVO, SendSmsReqVO };

// 查询短信模板精简列表
export const getSimpleSmsTemplateList = () => {
  return request.get<SmsTemplateVO[]>({ url: "/sms-template/simple-list" });
};

// 查询短信模板列表
export const getSmsTemplatePage = (params: PageParam) => {
  return request.get<{ list: SmsTemplateVO[]; total: number }>({
    url: "/sms-template/page",
    params,
  });
};

// 查询短信模板详情
export const getSmsTemplate = (id: number) => {
  return request.get<SmsTemplateVO>({ url: "/sms-template/get", params: { id } });
};

// 新增短信模板
export const createSmsTemplate = (data: Partial<SmsTemplateVO>) => {
  return request.post({ url: "/sms-template/create", data });
};

// 修改短信模板
export const updateSmsTemplate = (data: Partial<SmsTemplateVO>) => {
  return request.put({ url: "/sms-template/update", data });
};

// 删除短信模板
export const deleteSmsTemplate = (id: number) => {
  return request.delete({ url: "/sms-template/delete", params: { id } });
};

// 批量删除短信模板
export const deleteSmsTemplateList = (ids: number[]) => {
  return request.delete({ url: "/sms-template/delete-list", params: { ids: ids.join(",") } });
};

// 导出短信模板
export const exportSmsTemplate = (params: PageParam) => {
  return request.download({ url: "/sms-template/export-excel", params });
};

// 发送短信
export const sendSms = (data: SendSmsReqVO) => {
  return request.post({ url: "/sms-template/send-sms", data });
};
