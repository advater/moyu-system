/**
 * 基于 axios 封装的 http 请求
 *
 * 关键配置：
 * - withCredentials: true — 允许跨域请求携带 Cookie（后端 httpOnly cookie 认证）
 * - 响应拦截器中处理网络异常，结构化错误信息
 */
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import Axios from "axios";
import { resolveAxiosBaseURL } from "@/config/env";

interface IReqConfig extends AxiosRequestConfig {
  otherConfig?: Record<string, any>;
}

// 默认配置
const defaultConfig: AxiosRequestConfig = {
  baseURL: resolveAxiosBaseURL(),
  timeout: 12000,
  withCredentials: true, // 允许跨域请求携带 Cookie（后端 httpOnly cookie 认证）
};

// 处理网络错误
const statusMap: Record<number, string> = {
  400: "请求错误",
  401: "未授权，请重新登录",
  403: "拒绝访问",
  404: "请求地址出错，未找到该资源",
  405: "请求方法未允许",
  408: "请求超时, 请稍后再试",
  440: "网络连接错误, 请稍后再试",
  450: "网络CORS跨域, 请稍后再试",
  490: "请求取消",
  500: "网络不稳定500, 请稍后再试",
  501: "服务未实现",
  502: "网关错误, 请稍后再试",
  503: "服务不可用",
  504: "网关超时, 请稍后再试",
  505: "HTTP 版本不受支持",
};
const handleNetworkError = (errStatus: number): string => {
  return statusMap[errStatus] || `网络连接错误${errStatus}`;
};

// 创建单例 AxiosInstance，避免每次请求重复创建实例和拦截器
const http = Axios.create(defaultConfig);

// http拦截器
function setupInterceptor(httpInstance: AxiosInstance) {
  // 请求拦截器
  httpInstance.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => Promise.reject(error),
  );
  // 响应拦截器
  httpInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      const defaultResponse = {
        data: null,
        status: 440, // 自定义状态码
        message: "网络连接错误",
      };
      const statusCodeMap: Record<string, number> = {
        "invalid URL": 404,
        ECONNABORTED: 408,
        timeout: 408,
        ERR_NETWORK: 440,
        ERR_NETWORK_CORS: 450,
        ERR_CANCELED: 490,
      };
      if (error.code === "ERR_NETWORK" && !error.request) {
        error.message = "ERR_NETWORK_CORS";
      }
      // 如果没有 response，则根据 message 推断状态码
      if (!error.response) {
        error.response = { ...defaultResponse };
        const matchedKey = Object.keys(statusCodeMap)?.find((key) =>
          error.message.includes(key),
        );
        error.response.status = matchedKey
          ? statusCodeMap[matchedKey]
          : error.statusCode || 440;
      }
      const { response } = error;

      // 确保 response.data 存在并结构化
      response.data =
        response.data && typeof response.data !== "string" ? response.data : {};
      response.data.code = response.status;
      response.data.message =
        response.data.message ||
        response.data.msg ||
        handleNetworkError(response.status);
      error.response = response;
      return Promise.reject(error);
    },
  );
}
setupInterceptor(http);

// axiosRequest 实现
function axiosRequest<T = any>(options: IReqConfig): Promise<AxiosResponse<T>> {

  const { url, method, data, headers, otherConfig, signal } = options;
  const config: Record<string, any> = {
    url,
    method,
    headers,
    ...otherConfig,
  };
  if (data) {
    config.data = data;
  }
  if (signal) {
    config.signal = signal;
  }

  return http.request<T>(config);
}

export default axiosRequest;