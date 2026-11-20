import ResultCard from "@/components/Page/ResultCard";
import { useMyNotifyPage } from "./useMyNotifyPage";
import MyNotifySearch from "./MyNotifySearch";
import MyNotifyTable, { MyNotifyToolbar } from "./MyNotifyTable";
import MyNotifyDetailModal from "./MyNotifyDetailModal";

export default function MyNotifyMessagePage() {
  const p = useMyNotifyPage();

  return (
    <div>
      {p.messageHolder}
      <MyNotifySearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <MyNotifyToolbar
            selectedCount={p.selectedIds.length}
            onMarkRead={p.handleMarkRead}
            onMarkAllRead={p.handleMarkAllRead}
          />
        }
        total={p.pageData.total}
        current={p.pageData.currentPage}
        pageSize={p.pageData.pageSize}
        pageSizes={p.pageData.pageSizes}
        onPageChange={p.handleCurrentChange}
        onSizeChange={p.handleSizeChange}
      >
        <MyNotifyTable
          loading={p.loading}
          list={p.list}
          selectedIds={p.selectedIds}
          onSelect={p.setSelectedIds}
          onDetail={p.setDetail}
        />
      </ResultCard>
      <MyNotifyDetailModal detail={p.detail} onClose={() => p.setDetail(null)} />
    </div>
  );
}
