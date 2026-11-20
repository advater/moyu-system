import ResultCard from "@/components/Page/ResultCard";
import { useLoginLogPage } from "./useLoginLogPage";
import LoginLogSearch from "./LoginLogSearch";
import LoginLogTable, { LoginLogToolbar } from "./LoginLogTable";
import LoginLogDetailModal from "./LoginLogDetailModal";

export default function LoginLogPage() {
  const p = useLoginLogPage();

  return (
    <div>
      <LoginLogSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={<LoginLogToolbar exportLoading={p.exportLoading} onExport={p.handleExport} />}
        total={p.pageData.total}
        current={p.pageData.currentPage}
        pageSize={p.pageData.pageSize}
        pageSizes={p.pageData.pageSizes}
        onPageChange={p.handleCurrentChange}
        onSizeChange={p.handleSizeChange}
      >
        <LoginLogTable loading={p.loading} list={p.list} onDetail={p.setDetail} />
      </ResultCard>
      <LoginLogDetailModal detail={p.detail} onClose={() => p.setDetail(null)} />
    </div>
  );
}
