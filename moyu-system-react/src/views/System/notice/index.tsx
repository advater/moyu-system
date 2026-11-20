import ResultCard from "@/components/Page/ResultCard";
import { useNoticePage } from "./useNoticePage";
import NoticeSearch from "./NoticeSearch";
import NoticeTable, { NoticeToolbar } from "./NoticeTable";
import NoticeForm from "./NoticeForm";

export default function SystemNoticePage() {
  const p = useNoticePage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <NoticeSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <NoticeToolbar
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
        <NoticeTable
          loading={p.loading}
          list={p.list}
          selectedIds={p.selectedIds}
          onSelect={p.setSelectedIds}
          onEdit={(id) => p.openForm("update", id)}
          onDelete={p.handleDelete}
          onPush={p.handlePush}
          onStatusChange={p.handleStatusChange}
        />
      </ResultCard>
      <NoticeForm
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
