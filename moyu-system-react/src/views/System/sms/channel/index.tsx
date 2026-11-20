import ResultCard from "@/components/Page/ResultCard";
import { useSmsChannelPage } from "./useSmsChannelPage";
import SmsChannelSearch from "./SmsChannelSearch";
import SmsChannelTable, { SmsChannelToolbar } from "./SmsChannelTable";
import SmsChannelForm from "./SmsChannelForm";

export default function SystemSmsChannelPage() {
  const p = useSmsChannelPage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <SmsChannelSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <SmsChannelToolbar
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
        <SmsChannelTable
          loading={p.loading}
          list={p.list}
          selectedIds={p.selectedIds}
          onSelect={p.setSelectedIds}
          onEdit={(id) => p.openForm("update", id)}
          onDelete={p.handleDelete}
          onStatusChange={p.handleStatusChange}
        />
      </ResultCard>
      <SmsChannelForm
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
