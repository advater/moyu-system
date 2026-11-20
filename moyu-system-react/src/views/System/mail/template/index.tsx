import ResultCard from "@/components/Page/ResultCard";
import { useMailTemplatePage } from "./useMailTemplatePage";
import MailTemplateSearch from "./MailTemplateSearch";
import MailTemplateTable, { MailTemplateToolbar } from "./MailTemplateTable";
import MailTemplateForm from "./MailTemplateForm";
import MailTemplateSendModal from "./MailTemplateSendModal";

export default function SystemMailTemplatePage() {
  const p = useMailTemplatePage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <MailTemplateSearch form={p.form} accounts={p.accounts} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <MailTemplateToolbar
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
        <MailTemplateTable
          loading={p.loading}
          list={p.list}
          selectedIds={p.selectedIds}
          onSelect={p.setSelectedIds}
          onSend={p.setSendTemplate}
          onEdit={(id) => p.openForm("update", id)}
          onDelete={p.handleDelete}
          onStatusChange={p.handleStatusChange}
        />
      </ResultCard>
      <MailTemplateForm
        open={p.formOpen}
        type={p.formType}
        id={p.formId}
        accounts={p.accounts}
        onClose={() => p.setFormOpen(false)}
        onSuccess={() => {
          p.setFormOpen(false);
          p.getList();
        }}
      />
      <MailTemplateSendModal
        template={p.sendTemplate}
        loading={p.sendLoading}
        onClose={() => p.setSendTemplate(null)}
        onSubmit={p.handleSend}
      />
    </div>
  );
}
