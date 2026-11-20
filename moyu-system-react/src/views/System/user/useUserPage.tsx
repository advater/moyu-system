import { useCallback, useEffect, useState } from "react";
import { Form, Input, Modal, message } from "antd";
import { usePagination } from "@/hooks/usePagination";
import { handleTree } from "@/utils/tree";
import { CommonStatusEnum } from "@/utils/constants";
import { isProtectedAdminUser } from "@/utils/systemProtect";
import { downloadExcel } from "@/utils/file/down";
import * as UserApi from "@/api/system/user";
import * as DeptApi from "@/api/system/dept";

export function useUserPage() {
  const [form] = Form.useForm();
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();
  const { pageData, handleCurrentChange, handleSizeChange, resetPageData, setTotal } =
    usePagination();

  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [list, setList] = useState<UserApi.UserVO[]>([]);
  const [deptTree, setDeptTree] = useState<any[]>([]);
  const [deptId, setDeptId] = useState<number | undefined>();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTick, setSearchTick] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [formId, setFormId] = useState<number>();
  const [roleOpen, setRoleOpen] = useState(false);
  const [roleUser, setRoleUser] = useState<UserApi.UserVO | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const queryParams = useCallback(() => {
    const values = form.getFieldsValue();
    return {
      page: pageData.currentPage,
      pageSize: pageData.pageSize,
      username: values.username,
      mobile: values.mobile,
      status: values.status,
      deptId,
      createTime: values.createTime?.map((d: any) => d.format("YYYY-MM-DD HH:mm:ss")),
    };
  }, [form, pageData.currentPage, pageData.pageSize, deptId]);

  const getList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await UserApi.getUserPage(queryParams());
      setList(data?.list || []);
      setTotal(data?.total || 0);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [queryParams, setTotal]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (!cancelled) void getList();
    })();
    return () => {
      cancelled = true;
    };
  }, [pageData.currentPage, pageData.pageSize, deptId, searchTick]);

  useEffect(() => {
    DeptApi.getSimpleDeptList()
      .then((rows) => setDeptTree(handleTree(rows || [])))
      .catch(() => setDeptTree([]));
  }, []);

  const handleQuery = () => {
    resetPageData();
    setSearchTick(Date.now());
  };

  const handleReset = () => {
    form.resetFields();
    setDeptId(undefined);
    resetPageData();
    setSearchTick(Date.now());
  };

  const openForm = (type: "create" | "update", id?: number) => {
    setFormType(type);
    setFormId(id);
    setFormOpen(true);
  };

  const handleStatusChange = async (row: UserApi.UserVO, checked: boolean) => {
    if (isProtectedAdminUser(row.username)) {
      messageApi.warning("管理员状态不能修改");
      return;
    }
    const status = checked ? CommonStatusEnum.ENABLE : CommonStatusEnum.DISABLE;
    const text = status === CommonStatusEnum.ENABLE ? "启用" : "停用";
    try {
      await modal.confirm({
        title: "提示",
        content: `确认要${text}用户「${row.username}」吗？`,
      });
      await UserApi.updateUserStatus(row.id, status);
      messageApi.success("修改成功");
      getList();
    } catch {
      /* cancel */
    }
  };

  const handleDelete = (id: number) => {
    const row = list.find((item) => item.id === id);
    if (row && isProtectedAdminUser(row.username)) {
      messageApi.warning("管理员不能删除");
      return;
    }
    modal.confirm({
      title: "提示",
      content: "确认删除该用户？",
      onOk: async () => {
        await UserApi.deleteUser(id);
        messageApi.success("删除成功");
        getList();
      },
    });
  };

  const handleDeleteBatch = () => {
    const ids = selectedIds.filter((id) => {
      const row = list.find((item) => item.id === id);
      return !row || !isProtectedAdminUser(row.username);
    });
    if (!ids.length) {
      messageApi.warning("管理员不能删除");
      return;
    }
    modal.confirm({
      title: "提示",
      content: `确认删除选中的 ${ids.length} 条用户？`,
      onOk: async () => {
        await UserApi.deleteUserList(ids);
        setSelectedIds([]);
        messageApi.success("删除成功");
        getList();
      },
    });
  };

  const handleResetPwd = (row: UserApi.UserVO) => {
    let password = "";
    modal.confirm({
      title: "重置密码",
      content: (
        <Input.Password
          placeholder={`请输入「${row.username}」的新密码`}
          onChange={(e) => {
            password = e.target.value;
          }}
        />
      ),
      onOk: async () => {
        if (!password) {
          messageApi.error("请输入新密码");
          return Promise.reject();
        }
        await UserApi.resetUserPassword(row.id, password);
        messageApi.success(`修改成功，新密码是：${password}`);
      },
    });
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      downloadExcel(await UserApi.exportUser(queryParams()), "用户数据.xls");
    } finally {
      setExportLoading(false);
    }
  };

  return {
    form,
    modalHolder,
    messageHolder,
    pageData,
    loading,
    exportLoading,
    list,
    deptTree,
    selectedIds,
    formOpen,
    formType,
    formId,
    roleOpen,
    roleUser,
    importOpen,
    setDeptId,
    setSelectedIds,
    setFormOpen,
    setRoleOpen,
    setRoleUser,
    setImportOpen,
    resetPageData,
    handleCurrentChange,
    handleSizeChange,
    handleQuery,
    handleReset,
    openForm,
    handleStatusChange,
    handleDelete,
    handleDeleteBatch,
    handleResetPwd,
    handleExport,
    getList,
  };
}
