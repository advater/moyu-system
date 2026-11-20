import ResultCard from "@/components/Page/ResultCard";
import { useTenantPackagePage } from "./useTenantPackagePage";
import TenantPackageSearch from "./TenantPackageSearch";
import TenantPackageTable, { TenantPackageToolbar } from "./TenantPackageTable";
import TenantPackageForm from "./TenantPackageForm";

export default function SystemTenantPackagePage() {
  const p = useTenantPackagePage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <TenantPackageSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <TenantPackageToolbar
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
        <TenantPackageTable
          loading={p.loading}
          list={p.list}
          selectedIds={p.selectedIds}
          onSelect={p.setSelectedIds}
          onEdit={(id) => p.openForm("update", id)}
          onDelete={p.handleDelete}
          onStatusChange={p.handleStatusChange}
        />
      </ResultCard>
      <TenantPackageForm
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
