export interface UserVO {
  id: number;
  username: string;
  nickname: string;
  deptId?: number;
  deptName?: string;
  postIds?: number[];
  email?: string;
  mobile?: string;
  sex?: number;
  avatar?: string;
  loginIp?: string;
  status: number;
  remark?: string;
  loginDate?: string;
  createTime?: string;
}

export interface ProfileVO {
  id: number;
  username: string;
  nickname: string;
  dept?: { id: number; name: string };
  roles?: { id: number; name: string }[];
  posts?: { id: number; name: string }[];
  email?: string;
  mobile?: string;
  sex?: number;
  avatar?: string;
  status?: number;
  remark?: string;
  loginIp?: string;
  loginDate?: string;
  createTime?: string;
  tenantId?: number;
  tenant_id?: number;
}

export interface UserProfileUpdateReqVO {
  nickname?: string;
  email?: string;
  mobile?: string;
  sex?: number;
  avatar?: string;
}

