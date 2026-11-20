import ResultCard from "@/components/Page/ResultCard";
import { useSocialClientPage } from "./useSocialClientPage";
import SocialClientSearch from "./SocialClientSearch";
import SocialClientTable, { SocialClientToolbar } from "./SocialClientTable";
import SocialClientForm from "./SocialClientForm";

export default function SystemSocialClientPage() {
  const p = useSocialClientPage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <SocialClientSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <SocialClientToolbar
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
        <SocialClientTable
          loading={p.loading}
          list={p.list}
          selectedIds={p.selectedIds}
          onSelect={p.setSelectedIds}
          onEdit={(id) => p.openForm("update", id)}
          onDelete={p.handleDelete}
          onStatusChange={p.handleStatusChange}
        />
      </ResultCard>
      <SocialClientForm
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
