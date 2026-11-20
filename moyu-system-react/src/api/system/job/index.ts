import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { JobVO } from "./types";
export type { JobVO };

// 任务列表
export const getJobPage = (params: PageParam) => {
  return request.get<{ list: JobVO[]; total: number }>({ url: "/job/page", params });
};

// 任务详情
export const getJob = (id: number) => {
  return request.get<JobVO>({ url: "/job/get", params: { id } });
};

// 新增任务
export const createJob = (data: Partial<JobVO>) => {
  return request.post({ url: "/job/create", data });
};

// 修改定时任务调度
export const updateJob = (data: Partial<JobVO>) => {
  return request.put({ url: "/job/update", data });
};

// 删除定时任务调度
export const deleteJob = (id: number) => {
  return request.delete({ url: "/job/delete", params: { id } });
};

// 任务状态修改
export const updateJobStatus = (id: number, status: number) => {
  return request.put({ url: "/job/update-status", data: { id, status } });
};

// 定时任务立即执行一次
export const runJob = (id: number) => {
  return request.put({ url: "/job/trigger", data: { id } });
};

export const triggerJob = runJob;

export const getJobHandlerList = () => {
  return request.get<string[]>({ url: "/job/handler-list" });
};
