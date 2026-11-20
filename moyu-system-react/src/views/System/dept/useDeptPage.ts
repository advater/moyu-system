import { Form, Modal, message } from "antd";
import { useEffect, useState } from "react";
import { handleTree } from "@/utils/tree";
import { useStatusChange } from "@/components/StatusSwitch";
import * as DeptApi from "@/api/system/dept";
import * as UserApi from "@/api/system/user";

export function useDeptPage() {
  const [form] = Form.useForm();
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [userList, setUserList] = useState<UserApi.UserVO[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [formId, setFormId] = useState<number>();
  const [parentId, setParentId] = useState<number>(0);

  const getList = async () => {
    setLoading(true);
    try {
      const rows = await DeptApi.getDeptList(form.getFieldsValue());
      setList(handleTree(rows || []));
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getList();
    UserApi.getSimpleUserList().then(setUserList).catch(() => setUserList([]));
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

  const handleStatusChange = useStatusChange(DeptApi.updateDept, getList);

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "提示",
      content: "确认删除该部门？",
      onOk: async () => {
        await DeptApi.deleteDept(id);
        messageApi.success("删除成功");
        getList();
      },
    });
  };

  const handleDeleteBatch = () => {
    modal.confirm({
      title: "提示",
      content: `确认删除选中的 ${selectedIds.length} 条部门？`,
      onOk: async () => {
        await DeptApi.deleteDeptList(selectedIds);
        setSelectedIds([]);
        messageApi.success("删除成功");
        getList();
      },
    });
  };

  return {
    form,
    modalHolder,
    messageHolder,
    loading,
    list,
    userList,
    selectedIds,
    setSelectedIds,
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
    handleDeleteBatch,
    handleStatusChange,
  };
}
