import ResultCard from "@/components/Page/ResultCard";
import { useNotifyMessagePage } from "./useNotifyMessagePage";
import NotifyMessageSearch from "./NotifyMessageSearch";
import NotifyMessageTable from "./NotifyMessageTable";
import NotifyMessageDetailModal from "./NotifyMessageDetailModal";

export default function SystemNotifyMessagePage() {
  const p = useNotifyMessagePage();

  return (
    <div>
      <NotifyMessageSearch form={p.form} users={p.users} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        total={p.pageData.total}
        current={p.pageData.currentPage}
        pageSize={p.pageData.pageSize}
        pageSizes={p.pageData.pageSizes}
        onPageChange={p.handleCurrentChange}
        onSizeChange={p.handleSizeChange}
      >
        <NotifyMessageTable loading={p.loading} list={p.list} onDetail={p.setDetail} />
      </ResultCard>
      <NotifyMessageDetailModal detail={p.detail} onClose={() => p.setDetail(null)} />
    </div>
  );
}
