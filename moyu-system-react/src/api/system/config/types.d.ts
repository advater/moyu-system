export interface ConfigVO {
  id?: number;
  category?: string;
  name: string;
  configKey: string;
  value: string;
  visible: boolean;
  remark?: string;
  createTime?: string;
}

