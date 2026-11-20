import { useEffect, useState } from "react";
import { Form, Input, InputNumber, Modal, Radio, Switch, TreeSelect, message } from "antd";
import * as MenuApi from "@/api/system/menu";
import { handleTree } from "@/utils/tree";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import { CommonStatusEnum, SystemMenuTypeEnum } from "@/utils/constants";
import { isMenuStatusLocked, isSystemManageRoot } from "@/utils/systemProtect";

export default function MenuForm({
  open, type, id, parentId, onClose, onSuccess,
}: { open: boolean; type: "create" | "update"; id?: number; parentId?: number; onClose: () => void; onSuccess: () => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [menuTree, setMenuTree] = useState<any[]>([]);
  const [statusLocked, setStatusLocked] = useState(false);
  const menuType = Form.useWatch("type", form);
  const openKey = `${open}:${type}:${id ?? ""}:${parentId ?? ""}`;
  const [seenOpenKey, setSeenOpenKey] = useState(openKey);
  if (openKey !== seenOpenKey) {
    setSeenOpenKey(openKey);
    if (open) setStatusLocked(false);
  }

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    const load = async () => {
      const rows = await MenuApi.getSimpleMenusList();
      const tree = handleTree(rows || []);
      setMenuTree([{ id: 0, name: "顶级菜单", children: tree }]);
      if (type === "update" && id) {
        setLoading(true);
        try {
          const data = await MenuApi.getMenu(id);
          const locked = isMenuStatusLocked(id, tree) || isSystemManageRoot(data);
          setStatusLocked(locked);
          form.setFieldsValue({ ...data, ...(locked ? { visible: true } : {}) });
        } finally {
          setLoading(false);
        }
      } else {
        const locked = Boolean(parentId) && isMenuStatusLocked(parentId, tree);
        setStatusLocked(locked);
        form.setFieldsValue({
          parentId: parentId ?? 0,
          type: SystemMenuTypeEnum.DIR,
          status: CommonStatusEnum.ENABLE,
          visible: true,
          alwaysShow: true,
          keepAlive: true,
          sort: 0,
        });
      }
    };
    load();
  }, [open, type, id, parentId]);

  const submit = async () => {
    const values = await form.validateFields();
    if (statusLocked) {
      values.status = CommonStatusEnum.ENABLE;
      values.visible = true;
    }
    setLoading(true);
    try {
      if (type === "create") {
        await MenuApi.createMenu({
          ...values,
          alwaysShow: true,
          keepAlive: true,
        });
        message.success("新增成功");
      } else {
        await MenuApi.updateMenu({ ...values, id });
        message.success("修改成功");
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title={type === "create" ? "新增菜单" : "修改菜单"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden width={640}>
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="parentId" label="上级菜单">
          <TreeSelect treeData={menuTree} fieldNames={{ label: "name", value: "id", children: "children" }} treeDefaultExpandAll />
        </Form.Item>
        <Form.Item name="name" label="菜单名称" rules={[{ required: true, message: "菜单名称不能为空" }]}>
          <Input placeholder="请输入菜单名称" />
        </Form.Item>
        <Form.Item name="type" label="菜单类型" rules={[{ required: true }]}>
          <Radio.Group optionType="button" disabled={statusLocked} options={getIntDictOptions(DICT_TYPE.SYSTEM_MENU_TYPE)} />
        </Form.Item>
        {menuType !== 3 && (
          <Form.Item name="icon" label="菜单图标"><Input placeholder="请输入图标名" /></Form.Item>
        )}
        {menuType !== 3 && (
          <Form.Item name="path" label="路由地址"><Input placeholder="例如：/admin/user" /></Form.Item>
        )}
        {menuType === 2 && (
          <>
            <Form.Item name="component" label="组件地址"><Input placeholder="例如：system/user/index" /></Form.Item>
            <Form.Item name="componentName" label="组件名字"><Input placeholder="例如：SystemUser" /></Form.Item>
          </>
        )}
        {menuType !== 1 && (
          <Form.Item name="permission" label="权限标识"><Input placeholder="例如：system:user:query" /></Form.Item>
        )}
        <Form.Item name="sort" label="显示排序" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="status" hidden={statusLocked} label="菜单状态" rules={[{ required: true }]}>
          <Radio.Group options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} />
        </Form.Item>
        {menuType !== 3 && (
          <Form.Item name="visible" label="显示状态" valuePropName="checked">
            <Switch disabled={statusLocked} checkedChildren="显示" unCheckedChildren="隐藏" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
