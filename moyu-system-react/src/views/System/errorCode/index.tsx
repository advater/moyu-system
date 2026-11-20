import ResultCard from "@/components/Page/ResultCard";
import { useErrorCodePage } from "./useErrorCodePage";
import ErrorCodeSearch from "./ErrorCodeSearch";
import ErrorCodeTable, { ErrorCodeToolbar } from "./ErrorCodeTable";
import ErrorCodeForm from "./ErrorCodeForm";

export default function SystemErrorCodePage() {
  const p = useErrorCodePage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <ErrorCodeSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <ErrorCodeToolbar
            selectedCount={p.selectedIds.length}
            onCreate={() => p.openForm("create")}
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
        <ErrorCodeTable
          loading={p.loading}
          list={p.list}
          selectedIds={p.selectedIds}
          onSelect={p.setSelectedIds}
          onEdit={(id) => p.openForm("update", id)}
          onDelete={p.handleDelete}
        />
      </ResultCard>
      <ErrorCodeForm
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
