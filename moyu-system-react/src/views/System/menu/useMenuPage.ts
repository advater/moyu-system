import { Form, Modal, message } from "antd";
import { useEffect, useState } from "react";
import { handleTree } from "@/utils/tree";
import { markSystemManageStatusLocked } from "@/utils/systemProtect";
import { useStatusChange } from "@/components/StatusSwitch";
import * as MenuApi from "@/api/system/menu";

export function useMenuPage() {
  const [form] = Form.useForm();
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [formId, setFormId] = useState<number>();
  const [parentId, setParentId] = useState<number>(0);

  const getList = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const rows = await MenuApi.getMenuList(values);
      setList(markSystemManageStatusLocked(handleTree(rows || [])));
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getList();
  }, []);

  const handleQuery = () => {
    getList();
  };

  const handleReset = () => {
    form.resetFields();
    getList();
  };

  const openForm = (type: "create" | "update", id?: number, parent?: number) => {
    setFormType(type);
    setFormId(id);
    if (parent !== undefined) setParentId(parent);
    else if (type === "create") setParentId(0);
    setFormOpen(true);
  };

  const rawStatusChange = useStatusChange(MenuApi.updateMenu, getList);
  const handleStatusChange = async (row: any, status: number) => {
    if (row.statusLocked) return;
    await rawStatusChange(row, status);
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "提示",
      content: "确认删除该菜单？",
      onOk: async () => {
        try {
          await MenuApi.deleteMenu(id);
          messageApi.success("删除成功");
          getList();
        } catch {
          // 不能删除等原因由请求拦截器弹出后端 message
        }
      },
    });
  };

  return {
    form,
    modalHolder,
    messageHolder,
    loading,
    list,
    expanded,
    setExpanded,
    formOpen,
    formType,
    formId,
    parentId,
    setFormOpen,
    getList,
    handleQuery,
    handleReset,
    openForm,
    handleDelete,
    handleStatusChange,
  };
}
