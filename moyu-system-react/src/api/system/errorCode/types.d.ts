export interface ErrorCodeVO {
  id?: number;
  type: number;
  applicationName: string;
  code: number;
  message: string;
  memo?: string;
  createTime?: string;
}
