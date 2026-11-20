import ResultCard from "@/components/Page/ResultCard";
import { useSmsTemplatePage } from "./useSmsTemplatePage";
import SmsTemplateSearch from "./SmsTemplateSearch";
import SmsTemplateTable, { SmsTemplateToolbar } from "./SmsTemplateTable";
import SmsTemplateForm from "./SmsTemplateForm";
import SmsTemplateSendModal from "./SmsTemplateSendModal";

export default function SystemSmsTemplatePage() {
  const p = useSmsTemplatePage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <SmsTemplateSearch form={p.form} channels={p.channels} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <SmsTemplateToolbar
            selectedCount={p.selectedIds.length}
            exportLoading={p.exportLoading}
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
        <SmsTemplateTable
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
      <SmsTemplateForm
        open={p.formOpen}
        type={p.formType}
        id={p.formId}
        channels={p.channels}
        onClose={() => p.setFormOpen(false)}
        onSuccess={() => {
          p.setFormOpen(false);
          p.getList();
        }}
      />
      <SmsTemplateSendModal
        template={p.sendTemplate}
        loading={p.sendLoading}
        onClose={() => p.setSendTemplate(null)}
        onSubmit={p.handleSend}
      />
    </div>
  );
}
