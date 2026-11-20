import ResultCard from "@/components/Page/ResultCard";
import { useApiErrorLogPage } from "./useApiErrorLogPage";
import ApiErrorLogSearch from "./ApiErrorLogSearch";
import ApiErrorLogTable from "./ApiErrorLogTable";
import ApiErrorLogDetailModal from "./ApiErrorLogDetailModal";

export default function SystemApiErrorLogPage() {
  const p = useApiErrorLogPage();

  return (
    <div>
      {p.messageHolder}
      <ApiErrorLogSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        total={p.pageData.total}
        current={p.pageData.currentPage}
        pageSize={p.pageData.pageSize}
        pageSizes={p.pageData.pageSizes}
        onPageChange={p.handleCurrentChange}
        onSizeChange={p.handleSizeChange}
      >
        <ApiErrorLogTable loading={p.loading} list={p.list} onDetail={p.setDetail} onProcess={p.process} />
      </ResultCard>
      <ApiErrorLogDetailModal detail={p.detail} onClose={() => p.setDetail(null)} />
    </div>
  );
}
