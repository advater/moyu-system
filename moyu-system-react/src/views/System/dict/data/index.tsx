import ResultCard from "@/components/Page/ResultCard";
import { useDictDataPage } from "./useDictDataPage";
import DictDataSearch from "./DictDataSearch";
import DictDataTable, { DictDataToolbar } from "./DictDataTable";
import DictDataForm from "./DictDataForm";

export default function DictDataPage({ dictType, onBack }: { dictType: string; onBack: () => void }) {
  const p = useDictDataPage(dictType, onBack);

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <DictDataSearch
        form={p.form}
        currentType={p.currentType}
        typeList={p.typeList}
        onTypeChange={p.handleTypeChange}
        onBack={p.onBack}
        onQuery={p.handleQuery}
        onReset={p.handleReset}
      />
      <ResultCard
        toolbar={
          <DictDataToolbar
            selectedCount={p.selectedIds.length}
            onCreate={() => p.openForm("create")}
            onExport={p.handleExport}
            onDeleteBatch={p.handleDeleteBatch}
          />
        }
        total={p.pageData.total}
        current={p.pageData.currentPage}
        pageSize={p.pageData.pageSize}
        pageSizes={p.pageData.pageSizes}
        onPageChange={p.handleCurrentChange}
        onSizeChange={p.handleSizeChange}
      >
        <DictDataTable
          loading={p.loading}
          list={p.list}
          selectedIds={p.selectedIds}
          onSelect={p.setSelectedIds}
          onEdit={(id) => p.openForm("update", id)}
          onDelete={p.handleDelete}
          onStatusChange={p.handleStatusChange}
        />
      </ResultCard>
      <DictDataForm
        open={p.formOpen}
        type={p.formType}
        id={p.formId}
        dictType={p.currentType}
        onClose={() => p.setFormOpen(false)}
        onSuccess={() => {
          p.setFormOpen(false);
          p.getList();
        }}
      />
    </div>
  );
}
