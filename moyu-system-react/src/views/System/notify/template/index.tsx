import ResultCard from "@/components/Page/ResultCard";
import { useNotifyTemplatePage } from "./useNotifyTemplatePage";
import NotifyTemplateSearch from "./NotifyTemplateSearch";
import NotifyTemplateTable, { NotifyTemplateToolbar } from "./NotifyTemplateTable";
import NotifyTemplateForm from "./NotifyTemplateForm";
import NotifyTemplateSendModal from "./NotifyTemplateSendModal";

export default function SystemNotifyTemplatePage() {
  const p = useNotifyTemplatePage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <NotifyTemplateSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <NotifyTemplateToolbar
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
        <NotifyTemplateTable
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
      <NotifyTemplateForm
        open={p.formOpen}
        type={p.formType}
        id={p.formId}
        onClose={() => p.setFormOpen(false)}
        onSuccess={() => {
          p.setFormOpen(false);
          p.getList();
        }}
      />
      <NotifyTemplateSendModal
        template={p.sendTemplate}
        users={p.users}
        loading={p.sendLoading}
        onClose={() => p.setSendTemplate(null)}
        onSubmit={p.handleSend}
      />
    </div>
  );
}
