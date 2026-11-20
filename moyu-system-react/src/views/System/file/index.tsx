import ResultCard from "@/components/Page/ResultCard";
import { useFilePage } from "./useFilePage";
import FileSearch from "./FileSearch";
import FileTable, { FileToolbar } from "./FileTable";
import FileTransferPanel from "./FileTransferPanel";
import FilePreview from "./FilePreview";

export default function SystemFilePage() {
  const p = useFilePage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <FilePreview row={p.previewRow} onClose={p.closePreview} />
      <FileSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <FileToolbar
            selectedCount={p.selectedIds.length}
            onUpload={p.handleUpload}
            onDeleteBatch={p.handleDeleteBatch}
            uploadPercent={
              p.transfer?.kind === "upload" && p.transfer.phase !== "paused"
                ? p.transfer.percent
                : null
            }
            onAbortUpload={p.handlePause}
          />
        }
        total={p.pageData.total}
        current={p.pageData.currentPage}
        pageSize={p.pageData.pageSize}
        pageSizes={p.pageData.pageSizes}
        onPageChange={p.handleCurrentChange}
        onSizeChange={p.handleSizeChange}
      >
        <FileTransferPanel
          task={p.transfer}
          onPause={p.handlePause}
          onResume={p.handleResume}
          onCancel={p.handleCancelTransfer}
        />
        <FileTable
          loading={p.loading}
          list={p.list}
          selectedIds={p.selectedIds}
          onSelect={p.setSelectedIds}
          onPreview={p.handlePreview}
          onDownload={p.handleDownload}
          onDelete={p.handleDelete}
        />
      </ResultCard>
    </div>
  );
}
