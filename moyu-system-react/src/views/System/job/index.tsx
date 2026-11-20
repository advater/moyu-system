import ResultCard from "@/components/Page/ResultCard";
import { useJobPage } from "./useJobPage";
import JobSearch from "./JobSearch";
import JobTable, { JobToolbar } from "./JobTable";
import JobForm from "./JobForm";
import JobDetailModal from "./JobDetailModal";

export default function SystemJobPage() {
  const p = useJobPage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <JobSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <JobToolbar
            onCreate={() => p.openForm("create")}
            onLogs={() => p.goJobLog()}
          />
        }
        total={p.pageData.total}
        current={p.pageData.currentPage}
        pageSize={p.pageData.pageSize}
        pageSizes={p.pageData.pageSizes}
        onPageChange={p.handleCurrentChange}
        onSizeChange={p.handleSizeChange}
      >
        <JobTable
          loading={p.loading}
          list={p.list}
          onEdit={(id) => p.openForm("update", id)}
          onStatusChange={p.handleStatusChange}
          onTrigger={p.handleTrigger}
          onDetail={p.setDetail}
          onLogs={(id) => p.goJobLog(id)}
          onDelete={p.handleDelete}
        />
      </ResultCard>
      <JobForm
        open={p.formOpen}
        type={p.formType}
        id={p.formId}
        handlers={p.handlers}
        onClose={() => p.setFormOpen(false)}
        onSuccess={() => {
          p.setFormOpen(false);
          p.getList();
        }}
      />
      <JobDetailModal detail={p.detail} onClose={() => p.setDetail(null)} />
    </div>
  );
}
