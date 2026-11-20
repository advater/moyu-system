// function操作

/**
 * 对象转数组
 * key 子节点键
 * nodes 节点数组
 */
export function transformToArray(key: string, nodes: any[]) {
  if (!nodes) return [];
  const childKey = key;
  let list: any[] = [];
  if (Array.isArray(nodes)) {
    nodes.forEach((item) => {
      list.push(item);
      if (item[childKey]) {
        list = list.concat(transformToArray(key, item[childKey]));
      }
    });
  } else {
    list.push(nodes);
    if (nodes[childKey]) {
      list = list.concat(transformToArray(key, nodes[childKey]));
    }
  }
  return list;
}

/**
 * 数组转树对象
 * setting 配置信息的对象 {idKey节点的标识键 pIdKey父节点标识 children子节点键}
 * nodes 节点列表
 */
export function transformToTree(setting: any, nodes: any[]) {
  const key = setting.idKey;
  const parentKey = setting.pIdKey;
  const childKey = setting.children;

  if (!key || key === "" || !nodes) return [];

  if (Array.isArray(nodes)) {
    const rList: any[] = [];
    const tmpMap: Record<string, any> = {};
    nodes.forEach((item) => {
      tmpMap[item[key]] = item;
    });
    nodes.forEach((item) => {
      if (tmpMap[item[parentKey]] && item[key] !== item[parentKey]) {
        if (!tmpMap[item[parentKey]][childKey]) {
          tmpMap[item[parentKey]][childKey] = [];
        }
        tmpMap[item[parentKey]][childKey].push(item);
      } else {
        rList.push(item);
      }
    });
    return rList;
  } else {
    return [nodes];
  }
}

/* 递归查询节点 */
export function findNode(id: number, tree: any[], parent?: any): any {
  for (const node of tree) {
    if (node.id === id) {
      return {
        parent,
        node,
      };
    }
    if (node.children) {
      const find = findNode(id, node.children as any[], node);
      if (find) return find;
    }
  }
  return null;
}

/** 扁平列表转树（对齐 Vue3 handleTree，默认 parentId） */
export function handleTree(
  data: any[],
  id = "id",
  parentId = "parentId",
  children = "children",
) {
  return transformToTree(
    { idKey: id, pIdKey: parentId, children },
    Array.isArray(data) ? data.map((item) => ({ ...item })) : [],
  );
}

/**
 * 拼接菜单 path，对齐 Vue3 pathResolve：
 * 父 `/admin` + 子 `user` / `/user` → `/admin/user`
 * 子路径若已包含父前缀（如 `/admin/user`），则不再重复拼接。
 */
export function joinPath(parent: string, child?: string | null): string {
  const c = (child || "").trim();
  if (!c) return normalizePath(parent);
  if (/^https?:\/\//i.test(c)) return c;
  const childAbs = c.startsWith("/") ? c : `/${c}`;
  const p = (parent || "").replace(/\/$/, "");
  if (!p) return childAbs;
  const parentAbs = p.startsWith("/") ? p : `/${p}`;
  if (childAbs === parentAbs || childAbs.startsWith(`${parentAbs}/`)) {
    return childAbs;
  }
  return `${parentAbs}${childAbs}`.replace(/\/{2,}/g, "/");
}

export function normalizePath(path?: string | null): string {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}
