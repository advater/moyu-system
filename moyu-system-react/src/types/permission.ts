export interface IPermissionNode {
  id: number;
  title?: string;
  name?: string;
  path: string | null;
  component: string | null;
  componentName?: string;
  permission?: string;
  resource?: string;
  action?: string;
  type?: string | number;
  icon: string | null;
  sort: number;
  status: number;
  is_menu?: number;
  is_show?: number;
  visible?: boolean;
  checked?: boolean;
  children: IPermissionNode[];
}

export interface IMenuItem {
  title: string;
  path: string;
  icon?: string;
  children?: IMenuItem[];
}

export interface ISessionInfo {
  user?: Record<string, any>;
  roles?: string[];
  permissions?: string[];
  menus?: IPermissionNode[];
}

export interface ITenantOption {
  id: number;
  name: string;
}
