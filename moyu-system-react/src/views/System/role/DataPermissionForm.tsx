import { useEffect, useState } from "react";
import { Modal, Select, Space, Switch, Tag, Tree, message } from "antd";
import type { RoleVO } from "@/api/system/role";
import * as DeptApi from "@/api/system/dept";
import * as PermissionApi from "@/api/system/permission";
import { handleTree } from "@/utils/tree";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import { SystemDataScopeEnum } from "@/utils/constants";

export default function DataPermissionForm({
  open, role, onClose, onSuccess,
}: { open: boolean; role: RoleVO | null; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [dataScope, setDataScope] = useState<number>();
  const [treeData, setTreeData] = useState<any[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<number[]>([]);
  const [checkAll, setCheckAll] = useState(false);
  const [expandAll, setExpandAll] = useState(true);
  const [checkStrictly, setCheckStrictly] = useState(true);
  const [expandedKeys, setExpandedKeys] = useState<number[]>([]);

  const collectIds = (nodes: any[]): number[] =>
    nodes.flatMap((n) => [n.id, ...(n.children ? collectIds(n.children) : [])]);

  useEffect(() => {
    if (!open || !role) return;
    setDataScope(role.dataScope);
    setCheckedKeys(role.dataScopeDeptIds || []);
    DeptApi.getSimpleDeptList().then((rows) => {
      const tree = handleTree(rows || []);
      setTreeData(tree);
      setExpandedKeys(collectIds(tree));
    });
  }, [open, role]);

  const submit = async () => {
    if (!role || dataScope == null) return;
    setLoading(true);
    try {
      await PermissionApi.assignRoleDataScope({
        roleId: role.id,
        dataScope,
        dataScopeDeptIds: dataScope === SystemDataScopeEnum.DEPT_CUSTOM ? checkedKeys : [],
      });
      message.success("修改成功");
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title="数据权限" onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden width={720}>
      <Space style={{ marginBottom: 12 }}>
        <span>角色名称</span>
        <Tag>{role?.name}</Tag>
        <span>角色标识</span>
        <Tag>{role?.code}</Tag>
      </Space>
      <div style={{ marginBottom: 12 }}>
        权限范围：
        <Select
          style={{ width: 260 }}
          value={dataScope}
          onChange={setDataScope}
          options={getIntDictOptions(DICT_TYPE.SYSTEM_DATA_SCOPE)}
        />
      </div>
      {dataScope === SystemDataScopeEnum.DEPT_CUSTOM && (
        <>
          <div style={{ marginBottom: 8 }}>
            全选/全不选：
            <Switch checked={checkAll} onChange={(v) => { setCheckAll(v); setCheckedKeys(v ? collectIds(treeData) : []); }} />
            {"  "}全部展开/折叠：
            <Switch checked={expandAll} onChange={(v) => { setExpandAll(v); setExpandedKeys(v ? collectIds(treeData) : []); }} />
            {"  "}父子联动：
            <Switch checked={!checkStrictly} onChange={(v) => setCheckStrictly(!v)} />
          </div>
          <div style={{ maxHeight: 360, overflow: "auto", border: "1px solid #f0f0f0", padding: 12 }}>
            <Tree
              checkable
              checkStrictly={checkStrictly}
              checkedKeys={checkedKeys}
              expandedKeys={expandedKeys}
              onCheck={(keys) => setCheckedKeys((Array.isArray(keys) ? keys : keys.checked) as number[])}
              onExpand={(keys) => setExpandedKeys(keys as number[])}
              treeData={treeData}
              fieldNames={{ title: "name", key: "id", children: "children" }}
            />
          </div>
        </>
      )}
    </Modal>
  );
}
