import { useEffect, useState } from "react";
import { usePendingOpen } from "@/hooks/usePendingOpen";
import { Modal, Space, Switch, Tag, Tree, message } from "antd";
import type { RoleVO } from "@/api/system/role";
import * as MenuApi from "@/api/system/menu";
import * as PermissionApi from "@/api/system/permission";
import { handleTree } from "@/utils/tree";

export default function AssignMenuForm({
  open, role, onClose, onSuccess,
}: { open: boolean; role: RoleVO | null; onClose: () => void; onSuccess: () => void }) {
  const pendingKey = open && role ? String(role.id) : null;
  const { loading, setSubmitting, completePending } = usePendingOpen(pendingKey);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<number[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<number[]>([]);
  const [checkAll, setCheckAll] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [seenPendingKey, setSeenPendingKey] = useState(pendingKey);
  if (pendingKey !== seenPendingKey) {
    setSeenPendingKey(pendingKey);
    if (pendingKey) {
      setCheckAll(false);
      setExpandAll(false);
    }
  }

  const collectIds = (nodes: any[]): number[] =>
    nodes.flatMap((n) => [n.id, ...(n.children ? collectIds(n.children) : [])]);

  useEffect(() => {
    if (!open || !role) return;
    const key = String(role.id);
    let cancelled = false;
    Promise.all([MenuApi.getSimpleMenusList(), PermissionApi.getRoleMenuList(role.id)])
      .then(([menus, menuIds]) => {
        if (cancelled) return;
        const tree = handleTree(menus || []);
        setTreeData(tree);
        setCheckedKeys(menuIds || []);
      })
      .finally(() => { if (!cancelled) completePending(key); });
    return () => { cancelled = true; };
  }, [open, role, completePending]);

  const submit = async () => {
    if (!role) return;
    setSubmitting(true);
    try {
      await PermissionApi.assignRoleMenu({ roleId: role.id, menuIds: checkedKeys });
      message.success("修改成功");
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="菜单权限" onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden width={640}>
      <Space style={{ marginBottom: 12 }}>
        <span>角色名称</span>
        <Tag>{role?.name}</Tag>
        <span>角色标识</span>
        <Tag>{role?.code}</Tag>
      </Space>
      <div style={{ marginBottom: 8 }}>
        全选/全不选：
        <Switch
          checked={checkAll}
          onChange={(v) => {
            setCheckAll(v);
            setCheckedKeys(v ? collectIds(treeData) : []);
          }}
        />
        {"  "}全部展开/折叠：
        <Switch
          checked={expandAll}
          onChange={(v) => {
            setExpandAll(v);
            setExpandedKeys(v ? collectIds(treeData) : []);
          }}
        />
      </div>
      <div style={{ maxHeight: 400, overflow: "auto", border: "1px solid #f0f0f0", padding: 12 }}>
        <Tree
          checkable
          checkedKeys={checkedKeys}
          expandedKeys={expandedKeys}
          onCheck={(keys) => setCheckedKeys(keys as number[])}
          onExpand={(keys) => setExpandedKeys(keys as number[])}
          treeData={treeData}
          fieldNames={{ title: "name", key: "id", children: "children" }}
        />
      </div>
    </Modal>
  );
}
