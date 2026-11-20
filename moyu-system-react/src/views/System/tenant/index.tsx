import ResultCard from "@/components/Page/ResultCard";
import { useTenantPage } from "./useTenantPage";
import TenantSearch from "./TenantSearch";
import TenantTable, { TenantToolbar } from "./TenantTable";
import TenantForm from "./TenantForm";

export default function SystemTenantPage() {
  const p = useTenantPage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <TenantSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <TenantToolbar
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
        <TenantTable
          loading={p.loading}
          list={p.list}
          selectedIds={p.selectedIds}
          packageList={p.packageList}
          onSelect={p.setSelectedIds}
          onEdit={(id) => p.openForm("update", id)}
          onDelete={p.handleDelete}
          onStatusChange={p.handleStatusChange}
        />
      </ResultCard>
      <TenantForm
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
