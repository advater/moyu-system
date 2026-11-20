import ResultCard from "@/components/Page/ResultCard";
import { useDictTypePage } from "./useDictTypePage";
import DictTypeSearch from "./DictTypeSearch";
import DictTypeTable, { DictTypeToolbar } from "./DictTypeTable";
import DictTypeForm from "./DictTypeForm";
import DictDataPage from "./data";

export default function SystemDictPage() {
  const p = useDictTypePage();

  if (p.dataType) {
    return <DictDataPage dictType={p.dataType} onBack={() => p.setDataType(null)} />;
  }

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <DictTypeSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <DictTypeToolbar
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
        <DictTypeTable
          loading={p.loading}
          list={p.list}
          selectedIds={p.selectedIds}
          onSelect={p.setSelectedIds}
          onEdit={(id) => p.openForm("update", id)}
          onData={(type) => p.setDataType(type)}
          onDelete={p.handleDelete}
          onStatusChange={p.handleStatusChange}
        />
      </ResultCard>
      <DictTypeForm
        open={p.formOpen}
        type={p.formType}
        id={p.formId}
        onClose={() => p.setFormOpen(false)}
        onSuccess={() => {
          p.setFormOpen(false);
          p.getList();
        }}
      />
    </div>
  );
}
