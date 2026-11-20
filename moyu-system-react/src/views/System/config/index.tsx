import ResultCard from "@/components/Page/ResultCard";
import { useConfigPage } from "./useConfigPage";
import ConfigSearch from "./ConfigSearch";
import ConfigTable, { ConfigToolbar } from "./ConfigTable";
import ConfigForm from "./ConfigForm";

export default function SystemConfigPage() {
  const p = useConfigPage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <ConfigSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <ConfigToolbar
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
        <ConfigTable
          loading={p.loading}
          list={p.list}
          selectedIds={p.selectedIds}
          onSelect={p.setSelectedIds}
          onEdit={(id) => p.openForm("update", id)}
          onDelete={p.handleDelete}
        />
      </ResultCard>
      <ConfigForm
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
