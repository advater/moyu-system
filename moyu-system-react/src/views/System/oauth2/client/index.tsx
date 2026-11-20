import ResultCard from "@/components/Page/ResultCard";
import { useOAuth2ClientPage } from "./useOAuth2ClientPage";
import OAuth2ClientSearch from "./OAuth2ClientSearch";
import OAuth2ClientTable, { OAuth2ClientToolbar } from "./OAuth2ClientTable";
import OAuth2ClientForm from "./OAuth2ClientForm";

export default function SystemOAuth2ClientPage() {
  const p = useOAuth2ClientPage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <OAuth2ClientSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <OAuth2ClientToolbar
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
        <OAuth2ClientTable
          loading={p.loading}
          list={p.list}
          selectedIds={p.selectedIds}
          onSelect={p.setSelectedIds}
          onEdit={(id) => p.openForm("update", id)}
          onDelete={p.handleDelete}
          onStatusChange={p.handleStatusChange}
        />
      </ResultCard>
      <OAuth2ClientForm
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
