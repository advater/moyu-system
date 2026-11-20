import ResultCard from "@/components/Page/ResultCard";
import { useMailLogPage } from "./useMailLogPage";
import MailLogSearch from "./MailLogSearch";
import MailLogTable from "./MailLogTable";
import MailLogDetailModal from "./MailLogDetailModal";

export default function SystemMailLogPage() {
  const p = useMailLogPage();

  return (
    <div>
      <MailLogSearch form={p.form} accounts={p.accounts} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        total={p.pageData.total}
        current={p.pageData.currentPage}
        pageSize={p.pageData.pageSize}
        pageSizes={p.pageData.pageSizes}
        onPageChange={p.handleCurrentChange}
        onSizeChange={p.handleSizeChange}
      >
        <MailLogTable loading={p.loading} list={p.list} onDetail={p.setDetail} />
      </ResultCard>
      <MailLogDetailModal detail={p.detail} onClose={() => p.setDetail(null)} />
    </div>
  );
}
