import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { ErrorCodeVO } from "./types";
export type { ErrorCodeVO };

export const getErrorCodePage = (params: PageParam) => {
  return request.get<{ list: ErrorCodeVO[]; total: number }>({
    url: "/error-code/page",
    params,
  });
};

export const getErrorCode = (id: number) => {
  return request.get<ErrorCodeVO>({ url: "/error-code/get", params: { id } });
};

export const createErrorCode = (data: Partial<ErrorCodeVO>) => {
  return request.post({ url: "/error-code/create", data });
};

export const updateErrorCode = (data: Partial<ErrorCodeVO>) => {
  return request.put({ url: "/error-code/update", data });
};

export const deleteErrorCode = (id: number) => {
  return request.delete({ url: "/error-code/delete", params: { id }, data: { id } });
};

export const deleteErrorCodeList = (ids: number[]) => {
  return request.delete({
    url: "/error-code/delete-list",
    params: { ids: ids.join(",") },
    data: { ids },
  });
};
