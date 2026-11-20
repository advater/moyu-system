/**
 * 基于fetch 封装一个http 请求
 */
type Method =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE";
type Milliseconds = number;
type FetchHeaders = Record<string, string>;

interface FetchRequestConfig<D = any> {
  url?: string;
  method?: Method;
  data?: D;
  body?: BodyInit;
  headers?: FetchHeaders;
  signal?: AbortSignal;
  timeout?: Milliseconds;
}

interface FetchDefaults extends FetchRequestConfig {
  headers?: FetchHeaders;
}

type FetchOptions = Omit<FetchRequestConfig, "url">;

interface FetchResponse<T = any> {
  config: FetchOptions;
  data: T;
  headers: FetchHeaders;
  request: any;
  status: number;
  statusText: string;
}

interface InterceptorHandler<V> {
  fulfilled: (value: V) => V | Promise<V>;
  rejected: (error: any) => any;
}

type FetchInstance = Fetch;

interface IReqConfig extends FetchRequestConfig {
  otherConfig?: Record<string, any>;
}

// 默认配置
const defaultConfig: FetchRequestConfig = {
  timeout: 12000, // 请求超时
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

// http拦截器
function setupInterceptor(http: FetchInstance) {
  // 请求拦截器
  http.interceptors.request.use(
    (config: any) => {
      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );
  // 响应拦截器
  http.interceptors.response.use(
    (response: any) => {
      return response;
    },
    (error: any) => {
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
          error.message.includes(key)
        );
        error.response.status = matchedKey
          ? statusCodeMap[matchedKey]
          : error.statusCode || 440;
      }

      const { response } = error;

      // 确保 response.data 存在并结构化
      response.data = response.data || {};
      response.data.code = response.status;
      response.data.message =
        response.data.message || handleNetworkError(response.status);
      error.response = response;
      return Promise.reject(error);
    }
  );
}

// 拦截器管理类
class InterceptorManager<V> {
  private handlers: InterceptorHandler<V>[];

  constructor() {
    this.handlers = [];
  }

  use(
    fulfilled: (value: V) => V | Promise<V>,
    rejected: (error: any) => any
  ): number {
    this.handlers.push({
      fulfilled,
      rejected: rejected || ((error) => Promise.reject(error)),
    });
    return this.handlers.length - 1;
  }

  async runChain(input: V, isOk: boolean = true): Promise<V> {
    return this.handlers.reduce(
      (chain, handler) => {
        return chain.then(
          (value) => handler.fulfilled(value),
          (error) => handler.rejected(error)
        );
      },
      isOk ? Promise.resolve(input) : Promise.reject(input)
    );
  }
}

// Fetch 核心类
class Fetch {
  private defaults: FetchDefaults;
  interceptors: {
    request: InterceptorManager<FetchRequestConfig>;
    response: InterceptorManager<FetchResponse>;
  };

  constructor(instanceConfig: FetchRequestConfig) {
    this.defaults = instanceConfig;
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager(),
    };
  }

  async request<T = any>(
    config: FetchRequestConfig
  ): Promise<FetchResponse<T>> {
    if (!config.url) throw new Error("URL is required");
    const mergedConfig = { ...this.defaults, ...config };
    return this._request(config.url, mergedConfig);
  }

  private async _request<T>(
    url: string,
    config: FetchRequestConfig
  ): Promise<FetchResponse<T>> {
    // 处理请求体
    if (config.data instanceof FormData) {
      config.body = config.data;
      if (config.headers?.["Content-Type"]) {
        delete config.headers["Content-Type"];
      }
    } else if (config.data && config.headers) {
      if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
      }
      if (config.headers["Content-Type"] === "application/json") {
        config.body = JSON.stringify(config.data);
      }
    }

    // 超时控制器
    // 如果没有signal 则设置超时取消请求
    const controller = new AbortController();
    config.signal = config.signal || controller.signal;
    // 超时取消请求
    let timeoutId: ReturnType<typeof setTimeout> | number = 0;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject({
          code: "ECONNABORTED",
          name: "TimeoutError",
          message: `timeout of ${config.timeout}ms exceeded`,
        });
      }, config.timeout);
    });

    try {
      // 应用请求拦截器
      const fetchOptions = await this.interceptors.request.runChain(config);
      // 发起请求
      const response = (await Promise.race([
        fetch(url, fetchOptions),
        timeoutPromise,
      ])) as Response;
      // 清除超时定时器
      clearTimeout(timeoutId);
      // 处理响应body
      const data = await this.parseResponseBody(response);
      // 处理响应header
      const entries = response.headers.entries();
      const headers = Object.fromEntries(entries);
      // 处理响应response
      const fetchResponse: FetchResponse<T> = {
        config,
        data: data as T,
        headers,
        request: {},
        status: response.status,
        statusText: response.statusText,
      };
      // 请求失败抛出
      if (!response.ok) {
        throw {
          code: "ERR_" + response.statusText.toUpperCase().replace(" ", "_"),
          config: fetchResponse.config,
          message: `Request failed with status code ${response.status}`,
          name: "FetchError",
          request: fetchResponse.request,
          response: fetchResponse,
          status: response.status,
          stack: `FetchError: Request failed with status code ${response.status}\n ${response.url}`,
        };
      }
      // 处理响应拦截器后的response
      return this.interceptors.response.runChain(fetchResponse);
    } catch (error: any) {
      clearTimeout(timeoutId);
      controller.abort();
      // 处理AbortError（请求被取消）
      if (error.name === "AbortError") {
        error.code = "ERR_CANCELED";
        error.message = `ERR_CANCELED url:${url}`;
        error.status = 490;
      }
      if (error.name === "TimeoutError") {
        error.status = 408;
      }
      return this.interceptors.response.runChain(error, false);
    }
  }

  private parseResponseBody(response: Response) {
    const contentType = response.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    } else if (contentType.includes("multipart/form-data")) {
      return response.formData();
    } else if (contentType.includes("application/octet-stream")) {
      return response.arrayBuffer();
    } else {
      return response.text();
    }
  }

  static create(instanceConfig: FetchRequestConfig) {
    return new Fetch(instanceConfig);
  }
}

async function fetchRequest<T = any>(
  options: IReqConfig
): Promise<FetchResponse<T>> {
  const http = Fetch.create(defaultConfig);
  setupInterceptor(http);

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

export default fetchRequest;
