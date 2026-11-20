import ResultCard from "@/components/Page/ResultCard";
import { useJobLogPage } from "./useJobLogPage";
import JobLogSearch from "./JobLogSearch";
import JobLogTable from "./JobLogTable";
import JobLogDetailModal from "./JobLogDetailModal";

export default function SystemJobLoggerPage() {
  const p = useJobLogPage();

  return (
    <div>
      <JobLogSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} onBack={p.handleBack} />
      <ResultCard
        total={p.pageData.total}
        current={p.pageData.currentPage}
        pageSize={p.pageData.pageSize}
        pageSizes={p.pageData.pageSizes}
        onPageChange={p.handleCurrentChange}
        onSizeChange={p.handleSizeChange}
      >
        <JobLogTable loading={p.loading} list={p.list} onDetail={p.setDetail} />
      </ResultCard>
      <JobLogDetailModal detail={p.detail} onClose={() => p.setDetail(null)} />
    </div>
  );
}
