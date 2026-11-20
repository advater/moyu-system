import ResultCard from "@/components/Page/ResultCard";
import { useApiAccessLogPage } from "./useApiAccessLogPage";
import ApiAccessLogSearch from "./ApiAccessLogSearch";
import ApiAccessLogTable from "./ApiAccessLogTable";
import ApiAccessLogDetailModal from "./ApiAccessLogDetailModal";

export default function SystemApiAccessLogPage() {
  const p = useApiAccessLogPage();

  return (
    <div>
      <ApiAccessLogSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        total={p.pageData.total}
        current={p.pageData.currentPage}
        pageSize={p.pageData.pageSize}
        pageSizes={p.pageData.pageSizes}
        onPageChange={p.handleCurrentChange}
        onSizeChange={p.handleSizeChange}
      >
        <ApiAccessLogTable loading={p.loading} list={p.list} onDetail={p.setDetail} />
      </ResultCard>
      <ApiAccessLogDetailModal detail={p.detail} onClose={() => p.setDetail(null)} />
    </div>
  );
}
