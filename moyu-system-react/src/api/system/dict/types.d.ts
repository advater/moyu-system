export interface DictTypeVO {
  id?: number;
  name: string;
  type: string;
  status: number;
  remark?: string;
  createTime?: string;
}

export interface DictDataVO {
  id?: number;
  sort?: number;
  label: string;
  value: string;
  dictType: string;
  status: number;
  colorType?: string;
  cssClass?: string;
  remark?: string;
  createTime?: string;
}

