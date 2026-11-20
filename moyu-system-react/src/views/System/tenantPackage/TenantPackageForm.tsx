import { useEffect, useState } from "react";
import { Form, Input, Modal, Radio, Switch, Tree, message } from "antd";
import * as TenantPackageApi from "@/api/system/tenantPackage";
import * as MenuApi from "@/api/system/menu";
import { handleTree } from "@/utils/tree";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import { CommonStatusEnum } from "@/utils/constants";

export default function TenantPackageForm({
  open, type, id, onClose, onSuccess,
}: { open: boolean; type: "create" | "update"; id?: number; onClose: () => void; onSuccess: () => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<number[]>([]);
  const [checkAll, setCheckAll] = useState(false);
  const openKey = `${open}:${type}:${id ?? ""}`;
  const [seenOpenKey, setSeenOpenKey] = useState(openKey);
  if (openKey !== seenOpenKey) {
    setSeenOpenKey(openKey);
    if (open) setCheckAll(false);
  }

  const collectIds = (nodes: any[]): number[] =>
    nodes.flatMap((n) => [n.id, ...(n.children ? collectIds(n.children) : [])]);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    MenuApi.getSimpleMenusList().then(async (menus) => {
      const tree = handleTree(menus || []);
      setTreeData(tree);
      if (type === "update" && id) {
        setLoading(true);
        try {
          const data = await TenantPackageApi.getTenantPackage(id);
          form.setFieldsValue(data);
          setCheckedKeys(data.menuIds || []);
        } finally {
          setLoading(false);
        }
      } else {
        form.setFieldsValue({ status: CommonStatusEnum.ENABLE });
        setCheckedKeys([]);
      }
    });
  }, [open, type, id]);

  const submit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const payload = { ...values, id, menuIds: checkedKeys };
      if (type === "create") {
        await TenantPackageApi.createTenantPackage(payload);
        message.success("新增成功");
      } else {
        await TenantPackageApi.updateTenantPackage(payload);
        message.success("修改成功");
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title={type === "create" ? "新增套餐" : "修改套餐"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden width={640}>
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="name" label="套餐名" rules={[{ required: true, message: "套餐名不能为空" }]}>
          <Input placeholder="请输入套餐名" />
        </Form.Item>
        <Form.Item label="菜单权限">
          <div>
            全选/全不选 <Switch checked={checkAll} onChange={(v) => { setCheckAll(v); setCheckedKeys(v ? collectIds(treeData) : []); }} />
            <div style={{ maxHeight: 320, overflow: "auto", border: "1px solid #f0f0f0", padding: 8, marginTop: 8 }}>
              <Tree checkable checkedKeys={checkedKeys} onCheck={(keys) => setCheckedKeys(keys as number[])}
                treeData={treeData} fieldNames={{ title: "name", key: "id", children: "children" }} />
            </div>
          </div>
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true }]}>
          <Radio.Group options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
