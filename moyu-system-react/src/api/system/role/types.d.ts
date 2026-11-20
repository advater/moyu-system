export interface RoleVO {
  id: number;
  name: string;
  code: string;
  sort: number;
  status: number;
  type?: number;
  remark?: string;
  dataScope?: number;
  dataScopeDeptIds?: number[];
  createTime?: string;
}

