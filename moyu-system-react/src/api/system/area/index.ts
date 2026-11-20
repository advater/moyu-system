import { request } from "@/utils/request";

// 获得地区树
export const getAreaTree = () => {
  return request.get({ url: "/area/tree" });
};

// 获得 IP 对应的地区名
export const getAreaByIp = (ip: string) => {
  return request.get<string>({ url: "/area/get-by-ip", params: { ip } });
};

export const getAreaList = getAreaTree;
