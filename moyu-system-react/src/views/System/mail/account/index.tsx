import ResultCard from "@/components/Page/ResultCard";
import { useMailAccountPage } from "./useMailAccountPage";
import MailAccountSearch from "./MailAccountSearch";
import MailAccountTable, { MailAccountToolbar } from "./MailAccountTable";
import MailAccountForm from "./MailAccountForm";

export default function SystemMailAccountPage() {
  const p = useMailAccountPage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <MailAccountSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <MailAccountToolbar
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
        <MailAccountTable
          loading={p.loading}
          list={p.list}
          selectedIds={p.selectedIds}
          onSelect={p.setSelectedIds}
          onEdit={(id) => p.openForm("update", id)}
          onDelete={p.handleDelete}
        />
      </ResultCard>
      <MailAccountForm
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
