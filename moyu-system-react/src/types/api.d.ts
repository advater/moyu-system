/** 所有 api 接口的响应数据都应该准守该格式 */
interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

interface ApiList<T> {
  count: number;
  list: T;
}

interface ApiMessage {
  code: number;
  message: string;
}

type PromiseApi<T> = Promise<ApiResponse<T>>;
type PromiseApiList<T> = Promise<ApiResponse<ApiList<T>>>;
type PromiseApiMessage = Promise<ApiResponse<ApiMessage>>;

// type dataResponse<T> = {
//   code: number;
//   data: T;
//   message?: string;
// };
// type ApiResponse<T> = dataResponse<T> | string | number;
