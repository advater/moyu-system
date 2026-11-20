import { Modal, message } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useCrudList } from "@/hooks/useCrudList";
import { useStatusChange } from "@/components/StatusSwitch";
import { downloadExcel } from "@/utils/file/down";
import * as DictDataApi from "@/api/system/dict/dict.data";
import type { DictDataVO } from "@/api/system/dict/dict.data";
import * as DictTypeApi from "@/api/system/dict/dict.type";

export function useDictDataPage(dictType: string, onBack: () => void) {
  const [currentType, setCurrentType] = useState(dictType);
  const extraParams = useCallback(() => ({ dictType: currentType }), [currentType]);
  const crud = useCrudList<DictDataVO>(DictDataApi.getDictDataPage, extraParams);
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [formId, setFormId] = useState<number>();
  const [typeList, setTypeList] = useState<DictTypeApi.DictTypeVO[]>([]);

  const handleStatusChange = useStatusChange(DictDataApi.updateDictData, crud.getList);

  useEffect(() => {
    DictTypeApi.getSimpleDictTypeList().then(setTypeList).catch(() => setTypeList([]));
  }, []);

  const openForm = (type: "create" | "update", id?: number) => {
    setFormType(type);
    setFormId(id);
    setFormOpen(true);
  };

  const handleTypeChange = (value: string) => {
    setCurrentType(value);
    crud.handleQuery();
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "提示",
      content: "确认删除该字典数据？",
      onOk: async () => {
        await DictDataApi.deleteDictData(id);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleDeleteBatch = () => {
    modal.confirm({
      title: "提示",
      content: `确认删除选中的 ${crud.selectedIds.length} 条数据？`,
      onOk: async () => {
        await DictDataApi.deleteDictDataList(crud.selectedIds);
        crud.setSelectedIds([]);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleExport = async () => {
    downloadExcel(await DictDataApi.exportDictData(crud.queryParams()), "字典数据.xls");
  };

  return {
    ...crud,
    modalHolder,
    messageHolder,
    formOpen,
    formType,
    formId,
    dictType,
    typeList,
    currentType,
    onBack,
    setFormOpen,
    setCurrentType,
    handleTypeChange,
    openForm,
    handleDelete,
    handleDeleteBatch,
    handleExport,
    handleStatusChange,
  };
}
