import { Modal, message } from "antd";
import { useCrudList } from "@/hooks/useCrudList";
import { useStatusChange } from "@/components/StatusSwitch";
import { downloadExcel } from "@/utils/file/down";
import * as DictTypeApi from "@/api/system/dict/dict.type";
import type { DictTypeVO } from "@/api/system/dict/types";
import { useState } from "react";

export function useDictTypePage() {
  const crud = useCrudList<DictTypeVO>(DictTypeApi.getDictTypePage);
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [formId, setFormId] = useState<number>();
  const [dataType, setDataType] = useState<string | null>(null);

  const handleStatusChange = useStatusChange(DictTypeApi.updateDictType, crud.getList);

  const openForm = (type: "create" | "update", id?: number) => {
    setFormType(type);
    setFormId(id);
    setFormOpen(true);
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "提示",
      content: "确认删除该字典类型？",
      onOk: async () => {
        await DictTypeApi.deleteDictType(id);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleDeleteBatch = () => {
    modal.confirm({
      title: "提示",
      content: `确认删除选中的 ${crud.selectedIds.length} 条字典类型？`,
      onOk: async () => {
        await DictTypeApi.deleteDictTypeList(crud.selectedIds);
        crud.setSelectedIds([]);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleExport = async () => {
    downloadExcel(await DictTypeApi.exportDictType(crud.queryParams()), "字典类型.xls");
  };

  return {
    ...crud,
    modalHolder,
    messageHolder,
    formOpen,
    formType,
    formId,
    dataType,
    setFormOpen,
    setDataType,
    openForm,
    handleDelete,
    handleDeleteBatch,
    handleExport,
    handleStatusChange,
  };
}
