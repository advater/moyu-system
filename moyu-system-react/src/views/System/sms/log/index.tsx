import ResultCard from "@/components/Page/ResultCard";
import { useSmsLogPage } from "./useSmsLogPage";
import SmsLogSearch from "./SmsLogSearch";
import SmsLogTable, { SmsLogToolbar } from "./SmsLogTable";
import SmsLogDetailModal from "./SmsLogDetailModal";

export default function SystemSmsLogPage() {
  const p = useSmsLogPage();

  return (
    <div>
      <SmsLogSearch form={p.form} channels={p.channels} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={<SmsLogToolbar exportLoading={p.exportLoading} onExport={p.handleExport} />}
        total={p.pageData.total}
        current={p.pageData.currentPage}
        pageSize={p.pageData.pageSize}
        pageSizes={p.pageData.pageSizes}
        onPageChange={p.handleCurrentChange}
        onSizeChange={p.handleSizeChange}
      >
        <SmsLogTable loading={p.loading} list={p.list} onDetail={p.setDetail} />
      </ResultCard>
      <SmsLogDetailModal detail={p.detail} onClose={() => p.setDetail(null)} />
    </div>
  );
}
