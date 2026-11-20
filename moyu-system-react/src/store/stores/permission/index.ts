import { createSlice } from "@reduxjs/toolkit";
import { useAppSelector, useAppDispatch } from "../../hooks";
import type { IMenuItem, IPermissionNode, ISessionInfo } from "@/types/permission";
import { buildMenuList, flattenPermissionActions, resolvePermissionTree } from "./menu";

function resolveTree(payload: IPermissionNode[] | ISessionInfo | any): {
  tree: IPermissionNode[];
  extra: string[];
} {
  if (Array.isArray(payload)) return { tree: payload, extra: [] };
  return {
    tree: resolvePermissionTree(payload),
    extra: payload?.permissions || [],
  };
}

const permissionSlice = createSlice({
  name: "permission",
  initialState: {
    permissionTree: [] as IPermissionNode[],
    menuList: [] as IMenuItem[],
    permissionActions: [] as string[],
    hasLoaded: false,
  },
  reducers: {
    setPermissionTree: (state, action) => {
      const { tree, extra } = resolveTree(action.payload);
      state.permissionTree = tree;
      state.menuList = buildMenuList(tree);
      const fromTree = flattenPermissionActions(tree);
      extra.forEach((p: string) => fromTree.add(p));
      state.permissionActions = Array.from(fromTree);
      state.hasLoaded = true;
    },
    clearPermission: (state) => {
      state.permissionTree = [];
      state.menuList = [];
      state.permissionActions = [];
      state.hasLoaded = false;
    },
  },
});

export const { setPermissionTree, clearPermission } = permissionSlice.actions;
export default permissionSlice.reducer;

export const usePermissionStore = () => {
  const getPermissionTree = useAppSelector((state) => state.permission.permissionTree);
  const getMenuList = useAppSelector((state) => state.permission.menuList);
  const getPermissionActions = useAppSelector((state) => state.permission.permissionActions);
  const getHasLoaded = useAppSelector((state) => state.permission.hasLoaded);
  const dispatch = useAppDispatch();

  return {
    getPermissionTree,
    getMenuList,
    getPermissionActions,
    getHasLoaded,
    setPermissionTree: (value: IPermissionNode[] | ISessionInfo) => {
      dispatch(setPermissionTree(value));
    },
    clearPermission: () => {
      dispatch(clearPermission());
    },
  };
};
