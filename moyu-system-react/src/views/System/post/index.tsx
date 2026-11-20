import ResultCard from "@/components/Page/ResultCard";
import { usePostPage } from "./usePostPage";
import PostSearch from "./PostSearch";
import PostTable, { PostToolbar } from "./PostTable";
import PostForm from "./PostForm";

export default function SystemPostPage() {
  const p = usePostPage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <PostSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <PostToolbar
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
        <PostTable
          loading={p.loading}
          list={p.list}
          selectedIds={p.selectedIds}
          onSelect={p.setSelectedIds}
          onEdit={(id) => p.openForm("update", id)}
          onDelete={p.handleDelete}
          onStatusChange={p.handleStatusChange}
        />
      </ResultCard>
      <PostForm
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
