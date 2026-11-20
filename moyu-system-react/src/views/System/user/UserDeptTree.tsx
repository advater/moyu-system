import { Card, Tree } from "antd";

export default function UserDeptTree({
  treeData,
  onSelect,
}: {
  treeData: any[];
  onSelect: (deptId?: number) => void;
}) {
  return (
    <Card title="部门" size="small">
      <Tree
        treeData={treeData}
        fieldNames={{ title: "name", key: "id", children: "children" }}
        onSelect={(keys) => onSelect(keys[0] ? Number(keys[0]) : undefined)}
        defaultExpandAll
      />
    </Card>
  );
}
