import ResultCard from "@/components/Page/ResultCard";
import { useOperateLogPage } from "./useOperateLogPage";
import OperateLogSearch from "./OperateLogSearch";
import OperateLogTable, { OperateLogToolbar } from "./OperateLogTable";
import OperateLogDetailModal from "./OperateLogDetailModal";

export default function OperateLogPage() {
  const p = useOperateLogPage();

  return (
    <div>
      <OperateLogSearch form={p.form} userList={p.userList} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={<OperateLogToolbar exportLoading={p.exportLoading} onExport={p.handleExport} />}
        total={p.pageData.total}
        current={p.pageData.currentPage}
        pageSize={p.pageData.pageSize}
        pageSizes={p.pageData.pageSizes}
        onPageChange={p.handleCurrentChange}
        onSizeChange={p.handleSizeChange}
      >
        <OperateLogTable loading={p.loading} list={p.list} onDetail={p.setDetail} />
      </ResultCard>
      <OperateLogDetailModal detail={p.detail} onClose={() => p.setDetail(null)} />
    </div>
  );
}
